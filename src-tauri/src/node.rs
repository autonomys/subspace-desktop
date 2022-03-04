use anyhow::Result;
use log::warn;
use names::{Generator, Name};
use sc_chain_spec::ChainSpec;
use sc_executor::NativeExecutionDispatch;
use sc_executor::WasmExecutionMethod;
use sc_service::config::{KeystoreConfig, NetworkConfiguration, OffchainWorkerConfig};
use sc_service::{
    BasePath, Configuration, DatabaseSource, KeepBlocks, Role, RpcMethods, TracingReceiver,
    TransactionStorageMode,
};
use sc_tracing::logging::LoggerBuilder;
use sp_core::crypto::Ss58AddressFormat;
use std::env;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Once;
use subspace_service::{FullClient, NewFull};
use tokio::runtime::Handle;

static INITIALIZE_SUBSTRATE: Once = Once::new();

/// The maximum number of characters for a node name.
const NODE_NAME_MAX_LENGTH: usize = 64;

/// Default sub directory to store network config.
const DEFAULT_NETWORK_CONFIG_PATH: &'static str = "network";

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

// TODO: Allow customization of a bunch of these things
pub(crate) async fn create_full_client<CS: ChainSpec + 'static>(
    chain_spec: CS,
    base_path: PathBuf,
) -> Result<NewFull<Arc<FullClient<subspace_runtime::RuntimeApi, ExecutorDispatch>>>> {
    // This must only be initialized once
    INITIALIZE_SUBSTRATE.call_once(|| {
        dotenv::dotenv().ok();

        set_default_ss58_version(&chain_spec);

        sp_panic_handler::set(
            "https://discord.gg/vhKF9w3x",
            env!("SUBSTRATE_CLI_IMPL_VERSION"),
        );

        LoggerBuilder::new("info")
            .init()
            .expect("Logger initialization must not fail");

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
    )?;

    subspace_service::new_full::<subspace_runtime::RuntimeApi, ExecutorDispatch>(config, true)
        .await
        .map_err(Into::into)
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
) -> Result<Configuration> {
    let impl_name = "Subspace-desktop".to_string();
    let impl_version = env!("SUBSTRATE_CLI_IMPL_VERSION").to_string();
    let config_dir = base_path.config_dir(chain_spec.id());
    let net_config_dir = config_dir.join(DEFAULT_NETWORK_CONFIG_PATH);
    let client_id = format!("{}/v{}", impl_name, impl_version);
    let database_cache_size = 1024;
    let network = NetworkConfiguration::new(
        generate_node_name(),
        client_id,
        Default::default(),
        Some(net_config_dir),
    );
    let role = Role::Authority;
    let (keystore_remote, keystore) = (None, KeystoreConfig::InMemory);
    let telemetry_endpoints = chain_spec.telemetry_endpoints().clone();

    // Default value are used for many of parameters
    Ok(Configuration {
        impl_name,
        impl_version,
        tokio_handle,
        transaction_pool: Default::default(),
        network,
        keystore_remote,
        keystore,
        database: database_config(&config_dir, database_cache_size, &role),
        state_cache_size: 67_108_864,
        state_cache_child_ratio: None,
        state_pruning: Default::default(),
        keep_blocks: KeepBlocks::All,
        transaction_storage: TransactionStorageMode::BlockBody,
        wasm_method: WasmExecutionMethod::Compiled,
        wasm_runtime_overrides: None,
        execution_strategies: Default::default(),
        rpc_http: None,
        rpc_ws: Some("127.0.0.1:9945".parse().expect("IP and port are valid")),
        rpc_ipc: None,
        rpc_methods: RpcMethods::Auto,
        rpc_ws_max_connections: None,
        rpc_cors: Some(vec!["all".to_string()]),
        rpc_max_payload: None,
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
    })
}

/// Get the database configuration object for the parameters provided
fn database_config(base_path: &PathBuf, cache_size: usize, role: &Role) -> DatabaseSource {
    let role_dir = match role {
        Role::Light => "light",
        Role::Full | Role::Authority => "full",
    };
    let rocksdb_path = base_path.join("db").join(role_dir);
    let paritydb_path = base_path.join("paritydb").join(role_dir);
    DatabaseSource::Auto {
        paritydb_path,
        rocksdb_path,
        cache_size,
    }
}

/// Generate a valid random name for the node
pub fn generate_node_name() -> String {
    loop {
        let node_name = Generator::with_naming(Name::Numbered)
            .next()
            .expect("RNG is available on all supported platforms; qed");
        let count = node_name.chars().count();

        if count < NODE_NAME_MAX_LENGTH {
            return node_name;
        }
    }
}
