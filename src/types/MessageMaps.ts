/**
 * Base command map interface that can be extended by users.
 * @typedef {Object} BaseCommandMap
 */
export interface BaseCommandMap {
  // User Domain Commands
  'User.CreateUser': {
    data: { name: string; email: string; password: string };
    aggregateId: string;
    result: { userId: string; events: string[] };
  };
  'User.UpdateProfile': {
    data: { name?: string; email?: string };
    aggregateId: string;
    result: { success: boolean };
  };
  'User.ChangePassword': {
    data: { currentPassword: string; newPassword: string };
    aggregateId: string;
    result: { success: boolean };
  };
  
  // Order Domain Commands (пример расширения)
  'Order.CreateOrder': {
    data: { 
      userId: string; 
      items: Array<{ productId: string; quantity: number; price: number }>;
      totalAmount: number;
    };
    aggregateId: string;
    result: { orderId: string; status: string };
  };
  'Order.CancelOrder': {
    data: { reason: string };
    aggregateId: string;
    result: { success: boolean; refundAmount?: number };
  };
}

/**
 * Base query map interface that can be extended by users.
 * @typedef {Object} BaseQueryMap
 */
export interface BaseQueryMap {
  // User Domain Queries
  'User.GetUser': {
    params: { userId: string };
    result: { 
      id: string; 
      name: string; 
      email: string; 
      createdAt: Date; 
      lastLoginAt?: Date;
    };
  };
  'User.SearchUsers': {
    params: { 
      searchTerm?: string; 
      page?: number; 
      limit?: number;
      filters?: { role?: string; status?: string };
    };
    result: { 
      users: Array<{ id: string; name: string; email: string }>;
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    };
  };
  'User.GetUserStats': {
    params: { userId: string };
    result: {
      userId: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate?: Date;
      favoriteCategory?: string;
      loyaltyPoints: number;
    };
  };
  
  // Order Domain Queries
  'Order.GetOrder': {
    params: { orderId: string };
    result: { 
      id: string; 
      userId: string; 
      status: string; 
      items: Array<{ productId: string; quantity: number; price: number }>;
      totalAmount: number;
      createdAt: Date;
    };
  };
  'Order.GetOrderHistory': {
    params: { userId: string; page?: number; limit?: number };
    result: {
      orders: Array<{ id: string; status: string; totalAmount: number; createdAt: Date }>;
      total: number;
      page: number;
    };
  };
}

/**
 * Base event map interface that can be extended by users.
 * @typedef {Object} BaseEventMap
 */
export interface BaseEventMap {
  // User Domain Events
  'User.Created': {
    data: { name: string; email: string };
    aggregateId: string;
  };
  'User.ProfileUpdated': {
    data: { changes: Record<string, any> };
    aggregateId: string;
  };
  'User.PasswordChanged': {
    data: { userId: string };
    aggregateId: string;
  };
  'User.Deleted': {
    data: { userId: string; reason: string };
    aggregateId: string;
  };
  
  // Order Domain Events
  'Order.Created': {
    data: { 
      userId: string; 
      items: Array<{ productId: string; quantity: number; price: number }>;
      totalAmount: number;
    };
    aggregateId: string;
  };
  'Order.StatusChanged': {
    data: { oldStatus: string; newStatus: string };
    aggregateId: string;
  };
  'Order.Cancelled': {
    data: { reason: string; refundAmount?: number };
    aggregateId: string;
  };
}

/**
 * Default command map (backward compatibility).
 * @typedef {BaseCommandMap} CommandMap
 */
export type CommandMap = BaseCommandMap;

/**
 * Default query map (backward compatibility).
 * @typedef {BaseQueryMap} QueryMap
 */
export type QueryMap = BaseQueryMap;

/**
 * Default event map (backward compatibility).
 * @typedef {BaseEventMap} EventMap
 */
export type EventMap = BaseEventMap;

/**
 * Generic command type that can be extended.
 * @template T - Extended command map type
 * @typedef {keyof T & string} CommandType
 */
export type CommandType<T = CommandMap> = keyof T & string;

/**
 * Generic query type that can be extended.
 * @template T - Extended query map type
 * @typedef {keyof T & string} QueryType
 */
export type QueryType<T = QueryMap> = keyof T & string;

/**
 * Generic event type that can be extended.
 * @template T - Extended event map type
 * @typedef {keyof T & string} EventType
 */
export type EventType<T = EventMap> = keyof T & string;

/**
 * Extracts the data type for a given command type.
 * @template T - Command map type
 * @template K - Command type key
 * @typedef {T[K]['data']} CommandData
 */
export type CommandData<T extends Record<string, any> = CommandMap, K extends keyof T & string = keyof T & string> = T[K]['data'];

/**
 * Extracts the result type for a given command type.
 * @template T - Command map type
 * @template K - Command type key
 * @typedef {T[K]['result']} CommandResult
 */
export type CommandResult<T extends Record<string, any> = CommandMap, K extends keyof T & string = keyof T & string> = T[K]['result'];

/**
 * Extracts the params type for a given query type.
 * @template T - Query map type
 * @template K - Query type key
 * @typedef {T[K]['params']} QueryParams
 */
export type QueryParams<T extends Record<string, any> = QueryMap, K extends keyof T & string = keyof T & string> = T[K]['params'];

/**
 * Extracts the result type for a given query type.
 * @template T - Query map type
 * @template K - Query type key
 * @typedef {T[K]['result']} QueryResult
 */
export type QueryResult<T extends Record<string, any> = QueryMap, K extends keyof T & string = keyof T & string> = T[K]['result'];

/**
 * Extracts the data type for a given event type.
 * @template T - Event map type
 * @template K - Event type key
 * @typedef {T[K]['data']} EventData
 */
export type EventData<T extends Record<string, any> = EventMap, K extends keyof T & string = keyof T & string> = T[K]['data'];

/**
 * Utility type to extend the command map with custom commands.
 * @template T - Additional command map to merge
 * @typedef {CommandMap & T} ExtendCommandMap
 */
export type ExtendCommandMap<T extends Record<string, any>> = CommandMap & T;

/**
 * Utility type to extend the query map with custom queries.
 * @template T - Additional query map to merge
 * @typedef {QueryMap & T} ExtendQueryMap
 */
export type ExtendQueryMap<T extends Record<string, any>> = QueryMap & T;

/**
 * Utility type to extend the event map with custom events.
 * @template T - Additional event map to merge
 * @typedef {EventMap & T} ExtendEventMap
 */
export type ExtendEventMap<T extends Record<string, any>> = EventMap & T;
