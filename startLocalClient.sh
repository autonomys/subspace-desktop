docker network create spartan
docker volume create spartan-node-template
docker pull subspacelabs/node-template-spartan
docker run --rm --init -it \
--net spartan \
--name node-template-spartan-full \
--mount source=spartan-node-template,target=/var/spartan \
--publish 0.0.0.0:30333:30333 \
  --publish 127.0.0.1:9944:9944 \
  --publish 127.0.0.1:9933:9933 \
subspacelabs/node-template-spartan \
    --dev \
    --base-path /var/spartan \
    --ws-external \
    --rpc-cors=all \
    --rpc-methods=Unsafe \
    --rpc-external \
    --bootnodes /ip4/165.232.157.230/tcp/30333/p2p/12D3KooWEyoppNCUx8Yx66oV9fJnriXwCcXwDDUA2kj6vnc6iDEp \
    --telemetry-url "wss://telemetry.polkadot.io/submit/ 9"