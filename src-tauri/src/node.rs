use anyhow::{anyhow, Result};
use cirrus_runtime::GenesisConfig as ExecutionGenesisConfig;
use sc_chain_spec::ChainSpec;
use sc_client_api::HeaderBackend;
use sc_executor::{
    NativeElseWasmExecutor, NativeExecutionDispatch, WasmExecutionMethod,
    WasmtimeInstantiationStrategy,
};
use sc_network::config::{NodeKeyConfig, Secret};
use sc_service::config::{
    ExecutionStrategies, ExecutionStrategy, KeystoreConfig, NetworkConfiguration,
    OffchainWorkerConfig,
};
use sc_service::{
    BasePath, BlocksPruning, Configuration, DatabaseSource, PruningMode, Role,
    RpcMethods, TracingReceiver,
};
use sc_subspace_chain_specs::ConsensusChainSpec;
use sp_core::crypto::Ss58AddressFormat;
use std::env;
use std::path::PathBuf;
use std::sync::{Arc, Once, Weak};
use subspace_fraud_proof::VerifyFraudProof;
use subspace_runtime::{GenesisConfig as ConsensusGenesisConfig, RuntimeApi};
use subspace_runtime_primitives::opaque::Block;
use subspace_service::{FullClient, NewFull, SubspaceConfiguration};
use tokio::time::{sleep, timeout, Duration};
use tokio::{runtime::Handle, sync::Mutex, task::JoinHandle};
use tracing::{error, warn};

static INITIALIZE_SUBSTRATE: Once = Once::new();

/// The maximum number of characters for a node name.

/// Default sub directory to store network config.
const DEFAULT_NETWORK_CONFIG_PATH: &str = "network";

/// The file name of the node's Ed25519 secret key inside the chain-specific
/// network config directory.
const NODE_KEY_ED25519_FILE: &str = "secret_ed25519";

/// The recommended open file descriptor limit to be configured for the process.
const RECOMMENDED_OPEN_FILE_DESCRIPTOR_LIMIT: u64 = 10_000;

pub(crate) struct ExecutorDispatch;

impl NativeExecutionDispatch for ExecutorDispatch {
    type ExtendHostFunctions = ();

    fn dispatch(method: &str, data: &[u8]) -> Option<Vec<u8>> {
        subspace_runtime::api::dispatch(method, data)
    }

    fn native_version() -> sc_executor::NativeVersion {
        subspace_runtime::native_version()
    }
}

#[tauri::command]
/// starts a new node instance
/// if there is a node instance running previously,
/// first it stops the previous instance, then starts a new instance
pub(crate) async fn start_node(path: String, node_name: String) -> Result<String, String> {
    type FullClient<RuntimeApi, ExecutorDispatch> =
        sc_service::TFullClient<Block, RuntimeApi, NativeElseWasmExecutor<ExecutorDispatch>>;

    static NODE_HANDLE: Mutex<Option<JoinHandle<()>>> = Mutex::const_new(None);
    static WEAK_CLIENT: Mutex<Option<Weak<FullClient<RuntimeApi, ExecutorDispatch>>>> =
        Mutex::const_new(None);

    let mut node_handle_guard = NODE_HANDLE.lock().await;
    let mut weak_client_guard = WEAK_CLIENT.lock().await;

    // if there is already a node running, stop it
    if let Some(handle) = node_handle_guard.take() {
        handle.abort();
        while !handle.is_finished() {
            sleep(Duration::from_millis(200)).await;
        }
        let weak_client = weak_client_guard
            .take()
            .expect("previous instance is present");
        while weak_client.upgrade().is_some() {
            sleep(Duration::from_millis(200)).await;
        }
    }

    // wait for the previous instance to finish if new instance is unable to start
    // TODO: remove this when https://github.com/paritytech/substrate/issues/11654 and https://github.com/subspace/subspace/issues/578 are resolved
    // we cannot know the previous node instance is completely finished for now
    // IMPORTANT: don't remove the timeout mechanism, carry it to the other strategy when removing this: either `is_finished` or `Weak<Client>.upgrade()`
    if (timeout(Duration::from_secs(10), async {
        loop {
            match init_node(path.clone().into(), node_name.clone()).await {
                Ok((handle, weak_client)) => {
                    *node_handle_guard = Some(handle);
                    *weak_client_guard = Some(weak_client);
                    break;
                }
                Err(err) => {
                    error!(
                        "could not start the node with err: {err}, will wait for 200 milliseconds"
                    );
                    sleep(Duration::from_millis(200)).await;
                }
            }
        }
    })
    .await)
        .is_err()
    {
        error!(
            "Previous instance is not terminating for 10 seconds, unable to start a new instance"
        );
        return Err("Could not start a node instance in the backend!".into());
    }
    Ok("Successfully started the node in the backend".into())
}

async fn init_node(
    base_directory: PathBuf,
    node_name: String,
) -> Result<(
    JoinHandle<()>,
    Weak<sc_service::TFullClient<Block, RuntimeApi, NativeElseWasmExecutor<ExecutorDispatch>>>,
)> {
    let chain_spec: ConsensusChainSpec<ConsensusGenesisConfig, ExecutionGenesisConfig> =
        ConsensusChainSpec::from_json_bytes(include_bytes!("../chain-spec.json").as_ref())
            .map_err(anyhow::Error::msg)?;

    let full_client_fut = tokio::task::spawn_blocking(move || {
        Handle::current().block_on(create_full_client(chain_spec, base_directory, node_name))
    });
    let mut full_client = full_client_fut.await??;

    full_client.network_starter.start_network();

    let client = full_client.client;
    let weak = Arc::downgrade(&client);

    let node_handle = tokio::spawn(async move {
        if let Err(error) = full_client.task_manager.future().await {
            error!("Task manager exited with error: {error}");
        } else {
            error!("Task manager exited without error");
        }
    });

    Ok((node_handle, weak))
}

// TODO: Allow customization of a bunch of these things
async fn create_full_client<CS: ChainSpec + 'static>(
    chain_spec: CS,
    base_path: PathBuf,
    node_name: String,
) -> Result<
    NewFull<
        FullClient<RuntimeApi, ExecutorDispatch>,
        impl VerifyFraudProof + Clone + Send + Sync + 'static,
    >,
> {
    // This must only be initialized once
    INITIALIZE_SUBSTRATE.call_once(|| {
        dotenv::dotenv().ok();

        set_default_ss58_version(&chain_spec);

        sp_panic_handler::set(
            "https://discord.gg/vhKF9w3x",
            env!("SUBSTRATE_CLI_IMPL_VERSION"),
        );

        if let Some(new_limit) = fdlimit::raise_fd_limit() {
            if new_limit < RECOMMENDED_OPEN_FILE_DESCRIPTOR_LIMIT {
                warn!(
                    "Low open file descriptor limit configured for the process. \
                    Current value: {:?}, recommended value: {:?}.",
                    new_limit, RECOMMENDED_OPEN_FILE_DESCRIPTOR_LIMIT,
                );
            }
        }
    });

    let config = create_configuration(
        BasePath::Permanenent(base_path),
        chain_spec,
        Handle::current(),
        node_name,
    )?;

    let config_dir = config
        .base_path
        .as_ref()
        .map(|base_path| base_path.config_dir("subspace_gemini_1b"));

    let primary_chain_node = subspace_service::new_full::<RuntimeApi, ExecutorDispatch>(
        config,
        true,
        sc_consensus_slots::SlotProportion::new(2f32 / 3f32),
    )
    .await
    .map_err(|error| {
        sc_service::Error::Other(format!("Failed to build a full subspace node: {error:?}"))
    })?;

    if primary_chain_node.client.info().best_number == 33670 {
        if let Some(config_dir) = config_dir {
            let workaround_file = config_dir.join("network").join("gemini_1b_workaround");
            if !workaround_file.exists() {
                let _ = std::fs::write(workaround_file, &[]);
                let _ = std::fs::remove_file(config_dir.join("network").join("secret_ed25519"));
                return Err(anyhow!(
                    "Applied workaround for upgrade from gemini-1b-2022-jun-08, \
                                    please restart this node"
                ));
            }
        }
    }

    Ok(primary_chain_node)
}

fn set_default_ss58_version<CS: ChainSpec>(chain_spec: &CS) {
    let maybe_ss58_address_format = chain_spec
        .properties()
        .get("ss58Format")
        .map(|v| {
            v.as_u64()
                .expect("ss58Format must always be an unsigned number; qed")
        })
        .map(|v| {
            v.try_into()
                .expect("ss58Format must always be within u16 range; qed")
        })
        .map(Ss58AddressFormat::custom);

    if let Some(ss58_address_format) = maybe_ss58_address_format {
        sp_core::crypto::set_default_ss58_version(ss58_address_format);
    }
}

/// Create a Configuration object for the node
fn create_configuration<CS: ChainSpec + 'static>(
    base_path: BasePath,
    chain_spec: CS,
    tokio_handle: tokio::runtime::Handle,
    node_name: String,
) -> Result<SubspaceConfiguration> {
    let impl_name = "Subspace-desktop".to_string();
    let impl_version = env!("SUBSTRATE_CLI_IMPL_VERSION").to_string();
    let config_dir = base_path.config_dir(chain_spec.id());
    let net_config_dir = config_dir.join(DEFAULT_NETWORK_CONFIG_PATH);
    let client_id = format!("{}/v{}", impl_name, impl_version);
    let mut network = NetworkConfiguration::new(
        node_name,
        client_id,
        NodeKeyConfig::Ed25519(Secret::File(net_config_dir.join(NODE_KEY_ED25519_FILE))),
        Some(net_config_dir),
    );
    network.listen_addresses = vec![
        "/ip6/::/tcp/30333".parse().expect("Multiaddr is correct"),
        "/ip4/0.0.0.0/tcp/30333"
            .parse()
            .expect("Multiaddr is correct"),
    ];
    network.boot_nodes = chain_spec.boot_nodes().to_vec();

    // Increase default value of 25 to improve success rate of sync
    network.default_peers_set.out_peers = 50;
    // Full + Light clients
    network.default_peers_set.in_peers = 25 + 100;
    let role = Role::Authority;
    let (keystore_remote, keystore) = (None, KeystoreConfig::InMemory);
    let telemetry_endpoints = chain_spec.telemetry_endpoints().clone();

    // Default value are used for many of parameters
    Ok(SubspaceConfiguration {
        base: Configuration {
            impl_name,
            impl_version,
            tokio_handle,
            transaction_pool: Default::default(),
            network,
            keystore_remote,
            keystore,
            database: DatabaseSource::ParityDb {
                path: config_dir.join("paritydb").join("full"),
            },
            state_cache_size: 67_108_864,
            state_cache_child_ratio: None,
            // TODO: Change to constrained eventually (need DSN for this)
            state_pruning: Some(PruningMode::blocks_pruning(1024)),
            blocks_pruning: BlocksPruning::Some(1024),
            wasm_method: WasmExecutionMethod::Compiled {
                instantiation_strategy: WasmtimeInstantiationStrategy::PoolingCopyOnWrite,
            },
            wasm_runtime_overrides: None,
            execution_strategies: ExecutionStrategies {
                syncing: ExecutionStrategy::AlwaysWasm,
                importing: ExecutionStrategy::AlwaysWasm,
                block_construction: ExecutionStrategy::AlwaysWasm,
                offchain_worker: ExecutionStrategy::AlwaysWasm,
                other: ExecutionStrategy::AlwaysWasm,
            },
            rpc_http: None,
            rpc_ws: Some("127.0.0.1:9947".parse().expect("IP and port are valid")),
            rpc_ipc: None,
            // necessary in order to use `peers` method to show number of node peers during sync
            rpc_methods: RpcMethods::Unsafe,
            rpc_ws_max_connections: Default::default(),
            // Below CORS are default from Substrate
            rpc_cors: Some(vec![
                "http://localhost:*".to_string(),
                "http://127.0.0.1:*".to_string(),
                "https://localhost:*".to_string(),
                "https://127.0.0.1:*".to_string(),
                "https://polkadot.js.org".to_string(),
                "tauri://localhost".to_string(),
                "https://tauri.localhost".to_string(),
                "http://localhost:3009".to_string(),
            ]),
            rpc_max_payload: None,
            rpc_max_request_size: None,
            rpc_max_response_size: None,
            rpc_id_provider: None,
            ws_max_out_buffer_capacity: None,
            prometheus_config: None,
            telemetry_endpoints,
            default_heap_pages: None,
            offchain_worker: OffchainWorkerConfig::default(),
            force_authoring: env::var("FORCE_AUTHORING")
                .map(|force_authoring| force_authoring.as_str() == "1")
                .unwrap_or_default(),
            disable_grandpa: false,
            dev_key_seed: None,
            tracing_targets: None,
            tracing_receiver: TracingReceiver::Log,
            chain_spec: Box::new(chain_spec),
            max_runtime_instances: 8,
            announce_block: true,
            role,
            base_path: Some(base_path),
            informant_output_format: Default::default(),
            runtime_cache_size: 2,
            rpc_max_subs_per_conn: None,
        },
        force_new_slot_notifications: false,
        dsn_config: None,
    })
}
