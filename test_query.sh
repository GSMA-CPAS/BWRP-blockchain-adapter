export no_proxy="localhost,$no_proxy"
curl -i -X PUT -H "Content-Type: application/json" -d '{"rest_uri": "http://blockchain-adapter.local:3333/documents"}'  http://localhost:8080/config/offchain-db-adapter
echo ""