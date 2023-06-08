import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('Todos')

const todoAccess = new TodosAccess
const todosAttachments = new AttachmentUtils

export async function getTodosForUser(userId): Promise<TodoItem[]> {
    try {
        const result = await todoAccess.getTodosForUser(userId)
        return result
    } catch (e) {
        logger.error(`Failed to getTodosForUser: `, e)
        return null
    }
}

export async function getTodoForUser(userId, todoId): Promise<TodoItem> {
    try {
        const result = await todoAccess.getTodoForUser(userId, todoId)
        return result
    } catch (e) {
        logger.error(`Failed to getTodoForUser: `, e)
        return null
    }
}

export async function createTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
    const todoId = uuid.v4()

    try {
        const result = await todoAccess.createTodo({
            todoId: todoId,
            userId: userId,
            name: createTodoRequest.name,
            dueDate: createTodoRequest.dueDate,
            done: false,
            attachmentUrl: '',
            createdAt: new Date().toISOString()
        })
        logger.info(`Result from createTodo: ${result}`)
        return result
    } catch (e) {
        logger.error(`Failed to createTodo: `, e)
        return null
    }
}

export async function deleteTodo(todoId: string, userId: string): Promise<Boolean> {
    logger.info(`About to attempt delete of todo ${todoId} of user ${userId} `)

    try {
        const result = await todoAccess.deleteTodo(userId, todoId)
        return result
    } catch (e) {
        logger.info(`Failed to deleteTodo ${todoId}: `, e)
    }
}

export async function updateTodo(todoId: string, userId: string, updateRequest: UpdateTodoRequest): Promise<any> {
    logger.info(`About to attempt updateTodo of todo ${todoId} user ${userId}, with ${JSON.stringify(updateRequest)}`)

    try {
        const result = await todoAccess.updateTodo(userId, todoId, updateRequest)
        logger.info(`Result of updateTodo: `, result)
        return result
    } catch (e) {
        logger.error(`Failed to updateTodo: `, e)
        return false
    }
}

export async function updateTodoAttachmentUrl(userId: string, todoId: string, attachmentId: string): Promise<any> {
    const attachmentUrl = todosAttachments.getAttachmentUrl(attachmentId)

    logger.info(`Trying to updateTodoAttachmentUrl todo ${todoId} with attachment ID ${attachmentId}`)

    try {
        const result = await todoAccess.updateTodoAttachmentUrl(userId, todoId, attachmentUrl)
        return result
    } catch (e) {
        logger.error('Failed to updateTodoAttachmentUrl: ', JSON.stringify(e))
        return null
    }

}

export async function createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
    logger.info(`About to createAttachmentPresignedUrl id: ${attachmentId}`)
    return todosAttachments.getUploadUrl(attachmentId)
}
