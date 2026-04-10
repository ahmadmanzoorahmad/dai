import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CreateDashboardBody, Dashboard, DashboardStats, DashboardSummary, ErrorResponse, HealthStatus, UploadDashboardBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * Returns server health status
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Returns all saved dashboards sorted by creation date
 * @summary List all dashboards
 */
export declare const getListDashboardsUrl: () => string;
export declare const listDashboards: (options?: RequestInit) => Promise<DashboardSummary[]>;
export declare const getListDashboardsQueryKey: () => readonly ["/api/dashboards"];
export declare const getListDashboardsQueryOptions: <TData = Awaited<ReturnType<typeof listDashboards>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDashboards>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDashboards>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDashboardsQueryResult = NonNullable<Awaited<ReturnType<typeof listDashboards>>>;
export type ListDashboardsQueryError = ErrorType<unknown>;
/**
 * @summary List all dashboards
 */
export declare function useListDashboards<TData = Awaited<ReturnType<typeof listDashboards>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDashboards>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * Submits a URL or text content for AI processing and dashboard generation
 * @summary Create a new dashboard from a URL or uploaded text
 */
export declare const getCreateDashboardUrl: () => string;
export declare const createDashboard: (createDashboardBody: CreateDashboardBody, options?: RequestInit) => Promise<Dashboard>;
export declare const getCreateDashboardMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDashboard>>, TError, {
        data: BodyType<CreateDashboardBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDashboard>>, TError, {
    data: BodyType<CreateDashboardBody>;
}, TContext>;
export type CreateDashboardMutationResult = NonNullable<Awaited<ReturnType<typeof createDashboard>>>;
export type CreateDashboardMutationBody = BodyType<CreateDashboardBody>;
export type CreateDashboardMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Create a new dashboard from a URL or uploaded text
 */
export declare const useCreateDashboard: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDashboard>>, TError, {
        data: BodyType<CreateDashboardBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDashboard>>, TError, {
    data: BodyType<CreateDashboardBody>;
}, TContext>;
/**
 * @summary Get a dashboard by ID
 */
export declare const getGetDashboardUrl: (id: number) => string;
export declare const getDashboard: (id: number, options?: RequestInit) => Promise<Dashboard>;
export declare const getGetDashboardQueryKey: (id: number) => readonly [`/api/dashboards/${number}`];
export declare const getGetDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboard>>>;
export type GetDashboardQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a dashboard by ID
 */
export declare function useGetDashboard<TData = Awaited<ReturnType<typeof getDashboard>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a dashboard
 */
export declare const getDeleteDashboardUrl: (id: number) => string;
export declare const deleteDashboard: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteDashboardMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDashboard>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDashboard>>, TError, {
    id: number;
}, TContext>;
export type DeleteDashboardMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDashboard>>>;
export type DeleteDashboardMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Delete a dashboard
 */
export declare const useDeleteDashboard: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDashboard>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDashboard>>, TError, {
    id: number;
}, TContext>;
/**
 * Accepts file upload (PDF, CSV, Excel, Word) for AI processing
 * @summary Upload a file for dashboard generation
 */
export declare const getUploadDashboardUrl: () => string;
export declare const uploadDashboard: (uploadDashboardBody: UploadDashboardBody, options?: RequestInit) => Promise<Dashboard>;
export declare const getUploadDashboardMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadDashboard>>, TError, {
        data: BodyType<UploadDashboardBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof uploadDashboard>>, TError, {
    data: BodyType<UploadDashboardBody>;
}, TContext>;
export type UploadDashboardMutationResult = NonNullable<Awaited<ReturnType<typeof uploadDashboard>>>;
export type UploadDashboardMutationBody = BodyType<UploadDashboardBody>;
export type UploadDashboardMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Upload a file for dashboard generation
 */
export declare const useUploadDashboard: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadDashboard>>, TError, {
        data: BodyType<UploadDashboardBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof uploadDashboard>>, TError, {
    data: BodyType<UploadDashboardBody>;
}, TContext>;
/**
 * Returns aggregate stats (total count, source type breakdown, recent activity)
 * @summary Get dashboard library stats
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboards/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard library stats
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map