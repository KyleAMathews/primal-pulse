import { StackContext, Api, Config } from "sst/constructs"

export function API({ stack }: StackContext) {
  const CONNECTION_STRING_SECRET = new Config.Secret(stack, `CONNECTION_STRING`)

  const api = new Api(stack, `api`, {
    defaults: {
      function: {
        bind: [CONNECTION_STRING_SECRET],
      },
    },
    routes: {
      "GET /": {
        function: {
          handler: `packages/functions/src/lambda.handler`,
          timeout: 600,
        },
      },
    },
  })

  stack.addOutputs({
    ApiEndpoint: api.url,
  })
}
