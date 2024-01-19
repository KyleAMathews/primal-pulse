import { StackContext, Api, EventBus, Config } from "sst/constructs"

export function API({ stack }: StackContext) {
  const bus = new EventBus(stack, `bus`, {
    defaults: {
      retries: 10,
    },
  })

  const CONNECTION_STRING_SECRET = new Config.Secret(stack, `CONNECTION_STRING`)

  const api = new Api(stack, `api`, {
    defaults: {
      function: {
        bind: [bus, CONNECTION_STRING_SECRET],
      },
    },
    routes: {
      "GET /": `packages/functions/src/lambda.handler`,
      "GET /todo": `packages/functions/src/todo.list`,
      "POST /todo": `packages/functions/src/todo.create`,
    },
  })

  bus.subscribe(`todo.created`, {
    handler: `packages/functions/src/events/todo-created.handler`,
  })

  stack.addOutputs({
    ApiEndpoint: api.url,
  })
}
