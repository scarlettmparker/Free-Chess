/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AccountStatus =
  | 'ACTIVE'
  | 'DEACTIVATED'
  | 'PENDING'
  | 'SUSPENDED';

export type BoardLayoutInput = {
  description?: string | null | undefined;
  id?: string | number | null | undefined;
  name: string;
  placements?: unknown;
  slug: string;
};

/** A single filter applied to a paginated query. */
export type FilterInput = {
  field: string;
  operator: FilterOperator;
  value: string;
};

/** Operators for FilterInput. */
export type FilterOperator =
  | 'ENDS_WITH'
  | 'EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'IN'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'MATCHES'
  | 'NOT_EQUALS'
  | 'STARTS_WITH';

export type LoginInput = {
  password: string;
  username: string;
};

/** Generic pagination, sort, and filter input. */
export type PaginationInput = {
  filters?: Array<FilterInput> | null | undefined;
  page?: number | null | undefined;
  size?: number | null | undefined;
  sortBy?: string | null | undefined;
  sortDir?: SortDirection | null | undefined;
  sorts?: Array<SortInput> | null | undefined;
};

export type PieceInput = {
  description?: string | null | undefined;
  edgeReset: boolean;
  id?: string | number | null | undefined;
  isKing: boolean;
  moveStates?: unknown;
  name: string;
  promotionRanks?: Array<number> | null | undefined;
  promotionTargets?: Array<number> | null | undefined;
  slug: string;
  sprite: PieceSpriteInput;
  stateTransition: string;
};

export type PieceSetInput = {
  description?: string | null | undefined;
  id?: string | number | null | undefined;
  members?: Array<PieceSetMemberInput> | null | undefined;
  name: string;
  startingFen: string;
};

export type PieceSetMemberInput = {
  pieceDefinitionId: string | number;
  slot: string;
};

export type PieceSpriteInput = {
  bodyKey: string;
  footKey: string;
  headKey: string;
};

export type RegisterInput = {
  displayName?: string | null | undefined;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  username: string;
};

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type SortInput = {
  dir: SortDirection;
  field: string;
};

export type DeleteAccountMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteAccountMutation = { gaiaMutations: { deleteAccount: { message: string } } };

export type GetAccountQueryVariables = Exact<{
  id: string | number;
}>;


export type GetAccountQuery = { gaiaQueries: { account: { id: string, username: string, status: AccountStatus, createdAt: unknown, updatedAt: unknown } | null } };

export type ListAccountsQueryVariables = Exact<{
  pagination?: PaginationInput | null | undefined;
}>;


export type ListAccountsQuery = { gaiaQueries: { accounts: { items: Array<{ id: string, username: string, status: AccountStatus, createdAt: unknown, updatedAt: unknown }>, pageInfo: { totalCount: number } } } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { gaiaMutations: { login: { token: string, accountId: string, personId: string } | null } };

export type LoginWithGoogleMutationVariables = Exact<{
  code: string;
  redirectUri: string;
}>;


export type LoginWithGoogleMutation = { gaiaMutations: { loginWithGoogle: { token: string } } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { gaiaQueries: { me: { id: string, username: string, personId: string } | null } };

export type MyRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyRolesQuery = { gaiaQueries: { myRoles: Array<string> } };

export type RegisterAccountMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterAccountMutation = { gaiaMutations: { register: { accountId: string, personId: string, token: string } | null } };

export type RequestMagicLinkMutationVariables = Exact<{
  email: string;
}>;


export type RequestMagicLinkMutation = { gaiaMutations: { requestMagicLink: { message: string } } };

export type SetAccountPasswordMutationVariables = Exact<{
  accountId: string | number;
  newPassword: string;
}>;


export type SetAccountPasswordMutation = { gaiaMutations: { setAccountPassword: { message: string } } };

export type SetAccountRolesMutationVariables = Exact<{
  accountId: string | number;
  roleNames: Array<string> | string;
}>;


export type SetAccountRolesMutation = { gaiaMutations: { setAccountRoles: { message: string } } };

export type SuspendAccountMutationVariables = Exact<{
  id: string | number;
}>;


export type SuspendAccountMutation = { gaiaMutations: { suspendAccount: { message: string, account: { id: string, status: AccountStatus } } } };

export type UnsuspendAccountMutationVariables = Exact<{
  id: string | number;
}>;


export type UnsuspendAccountMutation = { gaiaMutations: { unsuspendAccount: { message: string, account: { id: string, status: AccountStatus } } } };

export type VerifyMagicLinkMutationVariables = Exact<{
  token: string;
}>;


export type VerifyMagicLinkMutation = { gaiaMutations: { verifyMagicLink: { token: string } } };

export type AuditLogsQueryVariables = Exact<{
  pagination?: PaginationInput | null | undefined;
}>;


export type AuditLogsQuery = { medusaQueries: { auditLogs: { total: number, items: Array<{ id: string, createdAt: unknown, actorId: string | null, actorEmail: string | null, action: string, target: string | null, outcome: string, detail: string | null, ip: string | null }> } } };

export type DeleteBoardLayoutMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteBoardLayoutMutation = { medusaMutations: { deleteBoardLayout: { ok: boolean } } };

export type DeletePieceMutationVariables = Exact<{
  id: string | number;
}>;


export type DeletePieceMutation = { medusaMutations: { deletePiece: { ok: boolean } } };

export type DeletePieceSetMutationVariables = Exact<{
  id: string | number;
}>;


export type DeletePieceSetMutation = { medusaMutations: { deletePieceSet: { ok: boolean } } };

export type GetBoardLayoutQueryVariables = Exact<{
  id: string | number;
}>;


export type GetBoardLayoutQuery = { medusaQueries: { boardLayout: { id: string, slug: string, name: string, description: string | null, placements: unknown, isSystem: boolean, createdAt: unknown, updatedAt: unknown } | null } };

export type GetPieceQueryVariables = Exact<{
  id: string | number;
}>;


export type GetPieceQuery = { medusaQueries: { piece: { id: string, slug: string, name: string, description: string | null, isKing: boolean, promotionTargets: Array<number> | null, promotionRanks: Array<number> | null, moveStates: unknown, stateTransition: string, edgeReset: boolean, isSystem: boolean, sprite: { headKey: string, bodyKey: string, footKey: string } | null } | null } };

export type GetPieceSetQueryVariables = Exact<{
  id: string | number;
}>;


export type GetPieceSetQuery = { medusaQueries: { pieceSet: { id: string, name: string, description: string | null, startingFen: string, isSystem: boolean, members: Array<{ slot: string, pieceDefinitionId: string }> } | null } };

export type ListBoardLayoutsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListBoardLayoutsQuery = { medusaQueries: { boardLayouts: Array<{ id: string, slug: string, name: string, description: string | null, placements: unknown, isSystem: boolean, createdAt: unknown, updatedAt: unknown }> } };

export type ListPieceSetsQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPieceSetsQuery = { medusaQueries: { pieceSets: Array<{ id: string, name: string, description: string | null, startingFen: string, isSystem: boolean, members: Array<{ slot: string, pieceDefinitionId: string }> }> } };

export type ListPiecesQueryVariables = Exact<{ [key: string]: never; }>;


export type ListPiecesQuery = { medusaQueries: { pieces: Array<{ id: string, slug: string, name: string, description: string | null, isKing: boolean, promotionTargets: Array<number> | null, promotionRanks: Array<number> | null, moveStates: unknown, stateTransition: string, edgeReset: boolean, isSystem: boolean, sprite: { headKey: string, bodyKey: string, footKey: string } | null }> } };

export type SaveBoardLayoutMutationVariables = Exact<{
  input: BoardLayoutInput;
}>;


export type SaveBoardLayoutMutation = { medusaMutations: { saveBoardLayout: { message: string, boardLayout: { id: string, slug: string, name: string } } } };

export type SavePieceMutationVariables = Exact<{
  input: PieceInput;
}>;


export type SavePieceMutation = { medusaMutations: { savePiece: { message: string, piece: { id: string, slug: string, name: string } } } };

export type SavePieceSetMutationVariables = Exact<{
  input: PieceSetInput;
}>;


export type SavePieceSetMutation = { medusaMutations: { savePieceSet: { message: string, pieceSet: { id: string, name: string } } } };


export const DeleteAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteAccountMutation, DeleteAccountMutationVariables>;
export const GetAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetAccountQuery, GetAccountQueryVariables>;
export const ListAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListAccounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListAccountsQuery, ListAccountsQueryVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}},{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LoginWithGoogleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"LoginWithGoogle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"redirectUri"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loginWithGoogle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"redirectUri"},"value":{"kind":"Variable","name":{"kind":"Name","value":"redirectUri"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]}}]} as unknown as DocumentNode<LoginWithGoogleMutation, LoginWithGoogleMutationVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}}]}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const MyRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myRoles"}}]}}]}}]} as unknown as DocumentNode<MyRolesQuery, MyRolesQueryVariables>;
export const RegisterAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"register"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]}}]} as unknown as DocumentNode<RegisterAccountMutation, RegisterAccountMutationVariables>;
export const RequestMagicLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestMagicLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestMagicLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<RequestMagicLinkMutation, RequestMagicLinkMutationVariables>;
export const SetAccountPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetAccountPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setAccountPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<SetAccountPasswordMutation, SetAccountPasswordMutationVariables>;
export const SetAccountRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetAccountRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"roleNames"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setAccountRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"accountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"roleNames"},"value":{"kind":"Variable","name":{"kind":"Name","value":"roleNames"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<SetAccountRolesMutation, SetAccountRolesMutationVariables>;
export const SuspendAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SuspendAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suspendAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SuspendAccountMutation, SuspendAccountMutationVariables>;
export const UnsuspendAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnsuspendAccount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unsuspendAccount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]}}]} as unknown as DocumentNode<UnsuspendAccountMutation, UnsuspendAccountMutationVariables>;
export const VerifyMagicLinkDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"VerifyMagicLink"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"gaiaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verifyMagicLink"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]}}]}}]} as unknown as DocumentNode<VerifyMagicLinkMutation, VerifyMagicLinkMutationVariables>;
export const AuditLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuditLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"auditLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"actorId"}},{"kind":"Field","name":{"kind":"Name","value":"actorEmail"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"outcome"}},{"kind":"Field","name":{"kind":"Name","value":"detail"}},{"kind":"Field","name":{"kind":"Name","value":"ip"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AuditLogsQuery, AuditLogsQueryVariables>;
export const DeleteBoardLayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBoardLayout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBoardLayout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteBoardLayoutMutation, DeleteBoardLayoutMutationVariables>;
export const DeletePieceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePiece"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePiece"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}}]}}]}}]}}]} as unknown as DocumentNode<DeletePieceMutation, DeletePieceMutationVariables>;
export const DeletePieceSetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePieceSet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePieceSet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ok"}}]}}]}}]}}]} as unknown as DocumentNode<DeletePieceSetMutation, DeletePieceSetMutationVariables>;
export const GetBoardLayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetBoardLayout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boardLayout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"placements"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetBoardLayoutQuery, GetBoardLayoutQueryVariables>;
export const GetPieceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPiece"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"piece"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isKing"}},{"kind":"Field","name":{"kind":"Name","value":"promotionTargets"}},{"kind":"Field","name":{"kind":"Name","value":"promotionRanks"}},{"kind":"Field","name":{"kind":"Name","value":"moveStates"}},{"kind":"Field","name":{"kind":"Name","value":"stateTransition"}},{"kind":"Field","name":{"kind":"Name","value":"edgeReset"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"sprite"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headKey"}},{"kind":"Field","name":{"kind":"Name","value":"bodyKey"}},{"kind":"Field","name":{"kind":"Name","value":"footKey"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPieceQuery, GetPieceQueryVariables>;
export const GetPieceSetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPieceSet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pieceSet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startingFen"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"pieceDefinitionId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetPieceSetQuery, GetPieceSetQueryVariables>;
export const ListBoardLayoutsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListBoardLayouts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boardLayouts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"placements"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<ListBoardLayoutsQuery, ListBoardLayoutsQueryVariables>;
export const ListPieceSetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListPieceSets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pieceSets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startingFen"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"slot"}},{"kind":"Field","name":{"kind":"Name","value":"pieceDefinitionId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListPieceSetsQuery, ListPieceSetsQueryVariables>;
export const ListPiecesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListPieces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaQueries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pieces"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"isKing"}},{"kind":"Field","name":{"kind":"Name","value":"promotionTargets"}},{"kind":"Field","name":{"kind":"Name","value":"promotionRanks"}},{"kind":"Field","name":{"kind":"Name","value":"moveStates"}},{"kind":"Field","name":{"kind":"Name","value":"stateTransition"}},{"kind":"Field","name":{"kind":"Name","value":"edgeReset"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"sprite"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"headKey"}},{"kind":"Field","name":{"kind":"Name","value":"bodyKey"}},{"kind":"Field","name":{"kind":"Name","value":"footKey"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ListPiecesQuery, ListPiecesQueryVariables>;
export const SaveBoardLayoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveBoardLayout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BoardLayoutInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveBoardLayout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"boardLayout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SaveBoardLayoutMutation, SaveBoardLayoutMutationVariables>;
export const SavePieceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SavePiece"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PieceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savePiece"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"piece"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SavePieceMutation, SavePieceMutationVariables>;
export const SavePieceSetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SavePieceSet"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PieceSetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"medusaMutations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savePieceSet"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"pieceSet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SavePieceSetMutation, SavePieceSetMutationVariables>;