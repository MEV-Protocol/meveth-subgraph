# MevETH Subgraph

Subgraph to index mevETH.

## Live Deployments

Explorer page with playground:

```
https://thegraph.com/explorer/subgraphs/[SUBGRAPH_ID]
```

GraphQL API url (API key is needed):

```
https://gateway.thegraph.com/api/[api-key]/subgraphs/id/[SUBGRAPH_ID]
```

## Build

Install dependencies
```
pnpm install
```

Compile
```
graph codegen && graph build
```

Deploy
```
graph deploy --studio meveth-subgraph
```
