/**
 * Command map for all supported commands in the system.
 * @typedef {Object} CommandMap
 */
export interface CommandMap {
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
 * Query map for all supported queries in the system.
 * @typedef {Object} QueryMap
 */
export interface QueryMap {
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
 * Event map for all supported events in the system.
 * @typedef {Object} EventMap
 */
export interface EventMap {
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
 * Utility type for all command types.
 * @typedef {keyof CommandMap} CommandType
 */
export type CommandType = keyof CommandMap;

/**
 * Utility type for all query types.
 * @typedef {keyof QueryMap} QueryType
 */
export type QueryType = keyof QueryMap;

/**
 * Utility type for all event types.
 * @typedef {keyof EventMap} EventType
 */
export type EventType = keyof EventMap;

/**
 * Extracts the data type for a given command type.
 * @template T
 * @typedef {CommandMap[T]['data']} CommandData
 */
export type CommandData<T extends CommandType> = CommandMap[T]['data'];

/**
 * Extracts the result type for a given command type.
 * @template T
 * @typedef {CommandMap[T]['result']} CommandResult
 */
export type CommandResult<T extends CommandType> = CommandMap[T]['result'];

/**
 * Extracts the params type for a given query type.
 * @template T
 * @typedef {QueryMap[T]['params']} QueryParams
 */
export type QueryParams<T extends QueryType> = QueryMap[T]['params'];

/**
 * Extracts the result type for a given query type.
 * @template T
 * @typedef {QueryMap[T]['result']} QueryResult
 */
export type QueryResult<T extends QueryType> = QueryMap[T]['result'];

/**
 * Extracts the data type for a given event type.
 * @template T
 * @typedef {EventMap[T]['data']} EventData
 */
export type EventData<T extends EventType> = EventMap[T]['data'];

/**
 * Utility type for extending the command map.
 * @template T
 * @typedef {CommandMap & T} ExtendCommandMap
 */
export type ExtendCommandMap<T extends Record<string, any>> = CommandMap & T;

/**
 * Utility type for extending the query map.
 * @template T
 * @typedef {QueryMap & T} ExtendQueryMap
 */
export type ExtendQueryMap<T extends Record<string, any>> = QueryMap & T;

/**
 * Utility type for extending the event map.
 * @template T
 * @typedef {EventMap & T} ExtendEventMap
 */
export type ExtendEventMap<T extends Record<string, any>> = EventMap & T;
