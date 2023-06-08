import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newBodyTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId = getUserId(event)
    const newTodo = await createTodo(newBodyTodo, userId)

    if (newTodo) {
      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Contol-Allow-Credentials': true
        },
        body: JSON.stringify({
          item: newTodo
        })
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: "An error ocurred, please review the logs for more information."
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
