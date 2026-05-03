import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type GetFunctionInvocationResultMetadataParam = FromSchema<typeof schemas.GetFunctionInvocationResult.metadata>;
export type GetFunctionInvocationResultResponse200 = FromSchema<typeof schemas.GetFunctionInvocationResult.response['200']>;
export type GetFunctionInvocationResultResponse202 = FromSchema<typeof schemas.GetFunctionInvocationResult.response['202']>;
export type GetFunctionInvocationResultResponse422 = FromSchema<typeof schemas.GetFunctionInvocationResult.response['422']>;
export type GetFunctionInvocationResultResponse500 = FromSchema<typeof schemas.GetFunctionInvocationResult.response['500']>;
export type InvokeFunctionBodyParam = FromSchema<typeof schemas.InvokeFunction.body>;
export type InvokeFunctionMetadataParam = FromSchema<typeof schemas.InvokeFunction.metadata>;
export type InvokeFunctionResponse200 = FromSchema<typeof schemas.InvokeFunction.response['200']>;
export type InvokeFunctionResponse202 = FromSchema<typeof schemas.InvokeFunction.response['202']>;
export type InvokeFunctionResponse422 = FromSchema<typeof schemas.InvokeFunction.response['422']>;
export type InvokeFunctionResponse500 = FromSchema<typeof schemas.InvokeFunction.response['500']>;
