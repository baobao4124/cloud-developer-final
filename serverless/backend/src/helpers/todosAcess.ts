import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

const docClient = new XAWS.DynamoDB.DocumentClient()
const createdAtIndex = process.env.TODOS_CREATED_AT_INDEX
const todosTable = process.env.TODOS_TABLE
const attachmentsBucker = process.env.ATTACHMENT_S3_BUCKET

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient()
  ) {
  }

  async getTodosForUser(userId: string): Promise<TodoItem[]> {

    logger.info(`About to fetch all todos for user: ${userId}`)

    try {

      const result = await docClient.query({
        TableName: todosTable,
        IndexName: createdAtIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise()

      logger.info(`Result of fetching todos: ${result}`)

      const todos = result.Items
      return todos as TodoItem[]

    } catch (e) {
      logger.error(`Failed to getAllUserTodos: `, e)
      return null
    }
  }

  async getTodoForUser(userId: string, todoId: string): Promise<TodoItem> {

    logger.info(`About to fetch single todo ${todoId} for user: ${userId}`)

    try {

      const todo: any = await this.docClient.get({
        TableName: todosTable,
        Key: {
          todoId,
          userId
        }
      }).promise()

      logger.info(`Result of fetching single todo: ${todo}`)

      return todo

    } catch (e) {
      logger.error(`Failed to getTodoForUser: `, e)
      return null
    }
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {

    try {
      const result = await this.docClient.put({
        TableName: todosTable,
        Item: todo
      }).promise()

      logger.info(`Result of createTodo: ${result}`)
      return todo

    } catch (e) {
      logger.error(`Failed to createTodo: `, e)
      return null
    }
  }

  async deleteTodo(userId: string, todoId: string): Promise<Boolean> {
    try {
      const result = await this.docClient.delete({
        TableName: todosTable,
        Key: {
          todoId,
          userId
        }
      }).promise()

      if (result) {

        try {
          logger.info(`About to try to delete from S3 bucket...`)
          const s3Result = await s3
            .deleteObject({
              Bucket: attachmentsBucker,
              Key: todoId
            })
            .promise()

          logger.info(`The result of trying to delete todo in S2: ${s3Result}`)
          return true
        } catch (e) {
          logger.error(`Failed to deleteTodo on s3delete: `, e)
          return false
        }

      } else {
        logger.error(`Problem with result of delete: ${result}`)
      }

    } catch (e) {
      logger.error(`Failed to deleteTodo: `, e)
      return false
    }
  }

  async updateTodo(userId: string, todoId: string, updateRequest: UpdateTodoRequest): Promise<Boolean> {

    try {
      logger.info(`Attempting to updateTodo ${todoId} of user ${userId} with this info ${JSON.stringify(updateRequest)}`)

      const result = await this.docClient.update({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set #name =:name, #dueDate=:dueDate, #done=:done',
        ExpressionAttributeValues: {
          ':name': updateRequest.name,
          ':dueDate': updateRequest.dueDate,
          ':done': updateRequest.done ? updateRequest.done : false
        },
        ExpressionAttributeNames: { '#name': 'name', '#dueDate': 'dueDate', '#done': 'done' },
        ReturnValues: 'UPDATED_NEW'
      }).promise()

      logger.info(`The result of the update ${result}`)
      return true;

    } catch (e) {
      logger.error(`Failed to updateTodo: `, e)
      return false
    }
  }

  async updateTodoAttachmentUrl(userId: string, todoId: string, attachmentUrl: string): Promise<any> {

    try {
      logger.info(`Attempting to updateTodoAttachmentUrl ${todoId} of user ${userId} with new attachmentId ${attachmentUrl}`)

      const result = await this.docClient.update({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      }).promise()

      return result

    } catch (e) {
      logger.error(`Failed to updateTodoAttachmentUrl ${todoId} of user ${userId} with new attachmentUrl. Error: ${e}`)
      return null
    }

  }
}
