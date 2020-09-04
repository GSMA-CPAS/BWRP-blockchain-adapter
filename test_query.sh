export no_proxy="localhost,$no_proxy"

DTAG_PORT=8080
TMUS_PORT=8081

echo "> setting rest uri on dtag"
curl -i -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://offchain-db-adapter-dtag:3333/documents"}'  http://localhost:${DTAG_PORT}/config/offchain-db-adapter
echo ""


echo "> setting rest uri on tmus"
curl -i -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://offchain-db-adapter-tmus:3334/documents"}'  http://localhost:${TMUS_PORT}/config/offchain-db-adapter
echo ""

