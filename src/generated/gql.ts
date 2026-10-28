/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation deactivateAccount {\n  gaiaMutations {\n    deactivateAccount {\n      message\n    }\n  }\n}": typeof types.DeactivateAccountDocument,
    "mutation DeleteAccount($id: ID!) {\n  gaiaMutations {\n    deleteAccount(id: $id) {\n      message\n    }\n  }\n}": typeof types.DeleteAccountDocument,
    "query GetAccount($id: ID!) {\n  gaiaQueries {\n    account(id: $id) {\n      id\n      username\n      status\n      roles\n      createdAt\n      updatedAt\n    }\n  }\n}": typeof types.GetAccountDocument,
    "query ListAccounts($pagination: PaginationInput) {\n  gaiaQueries {\n    accounts(pagination: $pagination) {\n      items {\n        id\n        username\n        status\n        roles\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        totalCount\n      }\n    }\n  }\n}": typeof types.ListAccountsDocument,
    "mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n      accountId\n      personId\n    }\n  }\n}": typeof types.LoginDocument,
    "mutation LoginWithGoogle($code: String!, $redirectUri: String!) {\n  gaiaMutations {\n    loginWithGoogle(code: $code, redirectUri: $redirectUri) {\n      token\n    }\n  }\n}": typeof types.LoginWithGoogleDocument,
    "query Me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n}": typeof types.MeDocument,
    "query MyRoles {\n  gaiaQueries {\n    myRoles\n  }\n}": typeof types.MyRolesDocument,
    "query propertySet($ownerKey: String!, $name: String!) {\n  gaiaQueries {\n    propertySet(ownerKey: $ownerKey, name: $name)\n  }\n}": typeof types.PropertySetDocument,
    "mutation RegisterAccount($input: RegisterInput!) {\n  gaiaMutations {\n    register(input: $input) {\n      accountId\n      personId\n      token\n    }\n  }\n}": typeof types.RegisterAccountDocument,
    "mutation RequestMagicLink($email: String!) {\n  gaiaMutations {\n    requestMagicLink(email: $email) {\n      message\n    }\n  }\n}": typeof types.RequestMagicLinkDocument,
    "mutation SetAccountPassword($accountId: ID!, $newPassword: String!) {\n  gaiaMutations {\n    setAccountPassword(accountId: $accountId, newPassword: $newPassword) {\n      message\n    }\n  }\n}": typeof types.SetAccountPasswordDocument,
    "mutation SetAccountRoles($accountId: ID!, $roleNames: [String!]!) {\n  gaiaMutations {\n    setAccountRoles(accountId: $accountId, roleNames: $roleNames) {\n      message\n    }\n  }\n}": typeof types.SetAccountRolesDocument,
    "mutation SuspendAccount($id: ID!) {\n  gaiaMutations {\n    suspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}": typeof types.SuspendAccountDocument,
    "mutation UnsuspendAccount($id: ID!) {\n  gaiaMutations {\n    unsuspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}": typeof types.UnsuspendAccountDocument,
    "mutation VerifyMagicLink($token: String!) {\n  gaiaMutations {\n    verifyMagicLink(token: $token) {\n      token\n    }\n  }\n}": typeof types.VerifyMagicLinkDocument,
    "mutation ArchiveGame($input: GameArchiveInput!) {\n  medusaMutations {\n    archiveGame(input: $input) {\n      message\n      game {\n        id\n        code\n        archivedAt\n      }\n    }\n  }\n}": typeof types.ArchiveGameDocument,
    "query AuditLogs($pagination: PaginationInput) {\n  medusaQueries {\n    auditLogs(pagination: $pagination) {\n      total\n      items {\n        id\n        createdAt\n        actorId\n        actorEmail\n        action\n        target\n        outcome\n        detail\n        ip\n      }\n    }\n  }\n}": typeof types.AuditLogsDocument,
    "mutation DeleteBoardLayout($id: ID!) {\n  medusaMutations {\n    deleteBoardLayout(id: $id) {\n      ok\n    }\n  }\n}": typeof types.DeleteBoardLayoutDocument,
    "mutation DeletePiece($id: ID!) {\n  medusaMutations {\n    deletePiece(id: $id) {\n      ok\n    }\n  }\n}": typeof types.DeletePieceDocument,
    "mutation DeletePieceSet($id: ID!) {\n  medusaMutations {\n    deletePieceSet(id: $id) {\n      ok\n    }\n  }\n}": typeof types.DeletePieceSetDocument,
    "query GameSupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}": typeof types.GameSupportDocument,
    "query GetBoardLayout($id: ID!) {\n  medusaQueries {\n    boardLayout(id: $id) {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}": typeof types.GetBoardLayoutDocument,
    "query GetGame($code: String!) {\n  medusaQueries {\n    game(code: $code) {\n      id\n      code\n      boardLayoutId\n      boardLayoutName\n      status\n      initialState\n      finalState\n      creatorAccountId\n      whiteAccountId\n      blackAccountId\n      whitePlayer {\n        id\n        username\n      }\n      blackPlayer {\n        id\n        username\n      }\n      viewerSeat\n      result\n      winnerAccountId\n      moveCount\n      createdAt\n      startedAt\n      finishedAt\n      archivedAt\n      moves {\n        ply\n        move\n        playedAt\n      }\n    }\n  }\n}": typeof types.GetGameDocument,
    "query GetPiece($id: ID!) {\n  medusaQueries {\n    piece(id: $id) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}": typeof types.GetPieceDocument,
    "query GetPieceSet($id: ID!) {\n  medusaQueries {\n    pieceSet(id: $id) {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}": typeof types.GetPieceSetDocument,
    "query ListBoardLayouts {\n  medusaQueries {\n    boardLayouts {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}": typeof types.ListBoardLayoutsDocument,
    "query ListPieceSets {\n  medusaQueries {\n    pieceSets {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}": typeof types.ListPieceSetsDocument,
    "query ListPieces($all: Boolean) {\n  medusaQueries {\n    pieces(all: $all) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      createdBy\n      ownerName\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}": typeof types.ListPiecesDocument,
    "query LobbySupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    boardLayouts {\n      id\n      name\n      description\n    }\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}": typeof types.LobbySupportDocument,
    "query MyGames($pagination: PaginationInput) {\n  medusaQueries {\n    myGames(pagination: $pagination) {\n      items {\n        id\n        code\n        boardLayoutName\n        status\n        finalState\n        creatorAccountId\n        whiteAccountId\n        blackAccountId\n        whitePlayer {\n          id\n          username\n        }\n        blackPlayer {\n          id\n          username\n        }\n        viewerSeat\n        result\n        winnerAccountId\n        moveCount\n        createdAt\n        startedAt\n        finishedAt\n        archivedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n      record {\n        wins\n        losses\n        draws\n        played\n      }\n    }\n  }\n}": typeof types.MyGamesDocument,
    "mutation SaveBoardLayout($input: BoardLayoutInput!) {\n  medusaMutations {\n    saveBoardLayout(input: $input) {\n      message\n      boardLayout {\n        id\n        slug\n        name\n      }\n    }\n  }\n}": typeof types.SaveBoardLayoutDocument,
    "mutation SavePiece($input: PieceInput!) {\n  medusaMutations {\n    savePiece(input: $input) {\n      message\n      piece {\n        id\n        slug\n        name\n      }\n    }\n  }\n}": typeof types.SavePieceDocument,
    "mutation SavePieceSet($input: PieceSetInput!) {\n  medusaMutations {\n    savePieceSet(input: $input) {\n      message\n      pieceSet {\n        id\n        name\n      }\n    }\n  }\n}": typeof types.SavePieceSetDocument,
};
const documents: Documents = {
    "mutation deactivateAccount {\n  gaiaMutations {\n    deactivateAccount {\n      message\n    }\n  }\n}": types.DeactivateAccountDocument,
    "mutation DeleteAccount($id: ID!) {\n  gaiaMutations {\n    deleteAccount(id: $id) {\n      message\n    }\n  }\n}": types.DeleteAccountDocument,
    "query GetAccount($id: ID!) {\n  gaiaQueries {\n    account(id: $id) {\n      id\n      username\n      status\n      roles\n      createdAt\n      updatedAt\n    }\n  }\n}": types.GetAccountDocument,
    "query ListAccounts($pagination: PaginationInput) {\n  gaiaQueries {\n    accounts(pagination: $pagination) {\n      items {\n        id\n        username\n        status\n        roles\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        totalCount\n      }\n    }\n  }\n}": types.ListAccountsDocument,
    "mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n      accountId\n      personId\n    }\n  }\n}": types.LoginDocument,
    "mutation LoginWithGoogle($code: String!, $redirectUri: String!) {\n  gaiaMutations {\n    loginWithGoogle(code: $code, redirectUri: $redirectUri) {\n      token\n    }\n  }\n}": types.LoginWithGoogleDocument,
    "query Me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n}": types.MeDocument,
    "query MyRoles {\n  gaiaQueries {\n    myRoles\n  }\n}": types.MyRolesDocument,
    "query propertySet($ownerKey: String!, $name: String!) {\n  gaiaQueries {\n    propertySet(ownerKey: $ownerKey, name: $name)\n  }\n}": types.PropertySetDocument,
    "mutation RegisterAccount($input: RegisterInput!) {\n  gaiaMutations {\n    register(input: $input) {\n      accountId\n      personId\n      token\n    }\n  }\n}": types.RegisterAccountDocument,
    "mutation RequestMagicLink($email: String!) {\n  gaiaMutations {\n    requestMagicLink(email: $email) {\n      message\n    }\n  }\n}": types.RequestMagicLinkDocument,
    "mutation SetAccountPassword($accountId: ID!, $newPassword: String!) {\n  gaiaMutations {\n    setAccountPassword(accountId: $accountId, newPassword: $newPassword) {\n      message\n    }\n  }\n}": types.SetAccountPasswordDocument,
    "mutation SetAccountRoles($accountId: ID!, $roleNames: [String!]!) {\n  gaiaMutations {\n    setAccountRoles(accountId: $accountId, roleNames: $roleNames) {\n      message\n    }\n  }\n}": types.SetAccountRolesDocument,
    "mutation SuspendAccount($id: ID!) {\n  gaiaMutations {\n    suspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}": types.SuspendAccountDocument,
    "mutation UnsuspendAccount($id: ID!) {\n  gaiaMutations {\n    unsuspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}": types.UnsuspendAccountDocument,
    "mutation VerifyMagicLink($token: String!) {\n  gaiaMutations {\n    verifyMagicLink(token: $token) {\n      token\n    }\n  }\n}": types.VerifyMagicLinkDocument,
    "mutation ArchiveGame($input: GameArchiveInput!) {\n  medusaMutations {\n    archiveGame(input: $input) {\n      message\n      game {\n        id\n        code\n        archivedAt\n      }\n    }\n  }\n}": types.ArchiveGameDocument,
    "query AuditLogs($pagination: PaginationInput) {\n  medusaQueries {\n    auditLogs(pagination: $pagination) {\n      total\n      items {\n        id\n        createdAt\n        actorId\n        actorEmail\n        action\n        target\n        outcome\n        detail\n        ip\n      }\n    }\n  }\n}": types.AuditLogsDocument,
    "mutation DeleteBoardLayout($id: ID!) {\n  medusaMutations {\n    deleteBoardLayout(id: $id) {\n      ok\n    }\n  }\n}": types.DeleteBoardLayoutDocument,
    "mutation DeletePiece($id: ID!) {\n  medusaMutations {\n    deletePiece(id: $id) {\n      ok\n    }\n  }\n}": types.DeletePieceDocument,
    "mutation DeletePieceSet($id: ID!) {\n  medusaMutations {\n    deletePieceSet(id: $id) {\n      ok\n    }\n  }\n}": types.DeletePieceSetDocument,
    "query GameSupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}": types.GameSupportDocument,
    "query GetBoardLayout($id: ID!) {\n  medusaQueries {\n    boardLayout(id: $id) {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}": types.GetBoardLayoutDocument,
    "query GetGame($code: String!) {\n  medusaQueries {\n    game(code: $code) {\n      id\n      code\n      boardLayoutId\n      boardLayoutName\n      status\n      initialState\n      finalState\n      creatorAccountId\n      whiteAccountId\n      blackAccountId\n      whitePlayer {\n        id\n        username\n      }\n      blackPlayer {\n        id\n        username\n      }\n      viewerSeat\n      result\n      winnerAccountId\n      moveCount\n      createdAt\n      startedAt\n      finishedAt\n      archivedAt\n      moves {\n        ply\n        move\n        playedAt\n      }\n    }\n  }\n}": types.GetGameDocument,
    "query GetPiece($id: ID!) {\n  medusaQueries {\n    piece(id: $id) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}": types.GetPieceDocument,
    "query GetPieceSet($id: ID!) {\n  medusaQueries {\n    pieceSet(id: $id) {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}": types.GetPieceSetDocument,
    "query ListBoardLayouts {\n  medusaQueries {\n    boardLayouts {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}": types.ListBoardLayoutsDocument,
    "query ListPieceSets {\n  medusaQueries {\n    pieceSets {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}": types.ListPieceSetsDocument,
    "query ListPieces($all: Boolean) {\n  medusaQueries {\n    pieces(all: $all) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      createdBy\n      ownerName\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}": types.ListPiecesDocument,
    "query LobbySupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    boardLayouts {\n      id\n      name\n      description\n    }\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}": types.LobbySupportDocument,
    "query MyGames($pagination: PaginationInput) {\n  medusaQueries {\n    myGames(pagination: $pagination) {\n      items {\n        id\n        code\n        boardLayoutName\n        status\n        finalState\n        creatorAccountId\n        whiteAccountId\n        blackAccountId\n        whitePlayer {\n          id\n          username\n        }\n        blackPlayer {\n          id\n          username\n        }\n        viewerSeat\n        result\n        winnerAccountId\n        moveCount\n        createdAt\n        startedAt\n        finishedAt\n        archivedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n      record {\n        wins\n        losses\n        draws\n        played\n      }\n    }\n  }\n}": types.MyGamesDocument,
    "mutation SaveBoardLayout($input: BoardLayoutInput!) {\n  medusaMutations {\n    saveBoardLayout(input: $input) {\n      message\n      boardLayout {\n        id\n        slug\n        name\n      }\n    }\n  }\n}": types.SaveBoardLayoutDocument,
    "mutation SavePiece($input: PieceInput!) {\n  medusaMutations {\n    savePiece(input: $input) {\n      message\n      piece {\n        id\n        slug\n        name\n      }\n    }\n  }\n}": types.SavePieceDocument,
    "mutation SavePieceSet($input: PieceSetInput!) {\n  medusaMutations {\n    savePieceSet(input: $input) {\n      message\n      pieceSet {\n        id\n        name\n      }\n    }\n  }\n}": types.SavePieceSetDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation deactivateAccount {\n  gaiaMutations {\n    deactivateAccount {\n      message\n    }\n  }\n}"): (typeof documents)["mutation deactivateAccount {\n  gaiaMutations {\n    deactivateAccount {\n      message\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteAccount($id: ID!) {\n  gaiaMutations {\n    deleteAccount(id: $id) {\n      message\n    }\n  }\n}"): (typeof documents)["mutation DeleteAccount($id: ID!) {\n  gaiaMutations {\n    deleteAccount(id: $id) {\n      message\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetAccount($id: ID!) {\n  gaiaQueries {\n    account(id: $id) {\n      id\n      username\n      status\n      roles\n      createdAt\n      updatedAt\n    }\n  }\n}"): (typeof documents)["query GetAccount($id: ID!) {\n  gaiaQueries {\n    account(id: $id) {\n      id\n      username\n      status\n      roles\n      createdAt\n      updatedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListAccounts($pagination: PaginationInput) {\n  gaiaQueries {\n    accounts(pagination: $pagination) {\n      items {\n        id\n        username\n        status\n        roles\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        totalCount\n      }\n    }\n  }\n}"): (typeof documents)["query ListAccounts($pagination: PaginationInput) {\n  gaiaQueries {\n    accounts(pagination: $pagination) {\n      items {\n        id\n        username\n        status\n        roles\n        createdAt\n        updatedAt\n      }\n      pageInfo {\n        totalCount\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n      accountId\n      personId\n    }\n  }\n}"): (typeof documents)["mutation Login($input: LoginInput!) {\n  gaiaMutations {\n    login(input: $input) {\n      token\n      accountId\n      personId\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation LoginWithGoogle($code: String!, $redirectUri: String!) {\n  gaiaMutations {\n    loginWithGoogle(code: $code, redirectUri: $redirectUri) {\n      token\n    }\n  }\n}"): (typeof documents)["mutation LoginWithGoogle($code: String!, $redirectUri: String!) {\n  gaiaMutations {\n    loginWithGoogle(code: $code, redirectUri: $redirectUri) {\n      token\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n}"): (typeof documents)["query Me {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyRoles {\n  gaiaQueries {\n    myRoles\n  }\n}"): (typeof documents)["query MyRoles {\n  gaiaQueries {\n    myRoles\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query propertySet($ownerKey: String!, $name: String!) {\n  gaiaQueries {\n    propertySet(ownerKey: $ownerKey, name: $name)\n  }\n}"): (typeof documents)["query propertySet($ownerKey: String!, $name: String!) {\n  gaiaQueries {\n    propertySet(ownerKey: $ownerKey, name: $name)\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RegisterAccount($input: RegisterInput!) {\n  gaiaMutations {\n    register(input: $input) {\n      accountId\n      personId\n      token\n    }\n  }\n}"): (typeof documents)["mutation RegisterAccount($input: RegisterInput!) {\n  gaiaMutations {\n    register(input: $input) {\n      accountId\n      personId\n      token\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RequestMagicLink($email: String!) {\n  gaiaMutations {\n    requestMagicLink(email: $email) {\n      message\n    }\n  }\n}"): (typeof documents)["mutation RequestMagicLink($email: String!) {\n  gaiaMutations {\n    requestMagicLink(email: $email) {\n      message\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetAccountPassword($accountId: ID!, $newPassword: String!) {\n  gaiaMutations {\n    setAccountPassword(accountId: $accountId, newPassword: $newPassword) {\n      message\n    }\n  }\n}"): (typeof documents)["mutation SetAccountPassword($accountId: ID!, $newPassword: String!) {\n  gaiaMutations {\n    setAccountPassword(accountId: $accountId, newPassword: $newPassword) {\n      message\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetAccountRoles($accountId: ID!, $roleNames: [String!]!) {\n  gaiaMutations {\n    setAccountRoles(accountId: $accountId, roleNames: $roleNames) {\n      message\n    }\n  }\n}"): (typeof documents)["mutation SetAccountRoles($accountId: ID!, $roleNames: [String!]!) {\n  gaiaMutations {\n    setAccountRoles(accountId: $accountId, roleNames: $roleNames) {\n      message\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SuspendAccount($id: ID!) {\n  gaiaMutations {\n    suspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}"): (typeof documents)["mutation SuspendAccount($id: ID!) {\n  gaiaMutations {\n    suspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UnsuspendAccount($id: ID!) {\n  gaiaMutations {\n    unsuspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}"): (typeof documents)["mutation UnsuspendAccount($id: ID!) {\n  gaiaMutations {\n    unsuspendAccount(id: $id) {\n      message\n      account {\n        id\n        status\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation VerifyMagicLink($token: String!) {\n  gaiaMutations {\n    verifyMagicLink(token: $token) {\n      token\n    }\n  }\n}"): (typeof documents)["mutation VerifyMagicLink($token: String!) {\n  gaiaMutations {\n    verifyMagicLink(token: $token) {\n      token\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ArchiveGame($input: GameArchiveInput!) {\n  medusaMutations {\n    archiveGame(input: $input) {\n      message\n      game {\n        id\n        code\n        archivedAt\n      }\n    }\n  }\n}"): (typeof documents)["mutation ArchiveGame($input: GameArchiveInput!) {\n  medusaMutations {\n    archiveGame(input: $input) {\n      message\n      game {\n        id\n        code\n        archivedAt\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query AuditLogs($pagination: PaginationInput) {\n  medusaQueries {\n    auditLogs(pagination: $pagination) {\n      total\n      items {\n        id\n        createdAt\n        actorId\n        actorEmail\n        action\n        target\n        outcome\n        detail\n        ip\n      }\n    }\n  }\n}"): (typeof documents)["query AuditLogs($pagination: PaginationInput) {\n  medusaQueries {\n    auditLogs(pagination: $pagination) {\n      total\n      items {\n        id\n        createdAt\n        actorId\n        actorEmail\n        action\n        target\n        outcome\n        detail\n        ip\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteBoardLayout($id: ID!) {\n  medusaMutations {\n    deleteBoardLayout(id: $id) {\n      ok\n    }\n  }\n}"): (typeof documents)["mutation DeleteBoardLayout($id: ID!) {\n  medusaMutations {\n    deleteBoardLayout(id: $id) {\n      ok\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeletePiece($id: ID!) {\n  medusaMutations {\n    deletePiece(id: $id) {\n      ok\n    }\n  }\n}"): (typeof documents)["mutation DeletePiece($id: ID!) {\n  medusaMutations {\n    deletePiece(id: $id) {\n      ok\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeletePieceSet($id: ID!) {\n  medusaMutations {\n    deletePieceSet(id: $id) {\n      ok\n    }\n  }\n}"): (typeof documents)["mutation DeletePieceSet($id: ID!) {\n  medusaMutations {\n    deletePieceSet(id: $id) {\n      ok\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GameSupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}"): (typeof documents)["query GameSupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetBoardLayout($id: ID!) {\n  medusaQueries {\n    boardLayout(id: $id) {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}"): (typeof documents)["query GetBoardLayout($id: ID!) {\n  medusaQueries {\n    boardLayout(id: $id) {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetGame($code: String!) {\n  medusaQueries {\n    game(code: $code) {\n      id\n      code\n      boardLayoutId\n      boardLayoutName\n      status\n      initialState\n      finalState\n      creatorAccountId\n      whiteAccountId\n      blackAccountId\n      whitePlayer {\n        id\n        username\n      }\n      blackPlayer {\n        id\n        username\n      }\n      viewerSeat\n      result\n      winnerAccountId\n      moveCount\n      createdAt\n      startedAt\n      finishedAt\n      archivedAt\n      moves {\n        ply\n        move\n        playedAt\n      }\n    }\n  }\n}"): (typeof documents)["query GetGame($code: String!) {\n  medusaQueries {\n    game(code: $code) {\n      id\n      code\n      boardLayoutId\n      boardLayoutName\n      status\n      initialState\n      finalState\n      creatorAccountId\n      whiteAccountId\n      blackAccountId\n      whitePlayer {\n        id\n        username\n      }\n      blackPlayer {\n        id\n        username\n      }\n      viewerSeat\n      result\n      winnerAccountId\n      moveCount\n      createdAt\n      startedAt\n      finishedAt\n      archivedAt\n      moves {\n        ply\n        move\n        playedAt\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetPiece($id: ID!) {\n  medusaQueries {\n    piece(id: $id) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}"): (typeof documents)["query GetPiece($id: ID!) {\n  medusaQueries {\n    piece(id: $id) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetPieceSet($id: ID!) {\n  medusaQueries {\n    pieceSet(id: $id) {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}"): (typeof documents)["query GetPieceSet($id: ID!) {\n  medusaQueries {\n    pieceSet(id: $id) {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListBoardLayouts {\n  medusaQueries {\n    boardLayouts {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}"): (typeof documents)["query ListBoardLayouts {\n  medusaQueries {\n    boardLayouts {\n      id\n      slug\n      name\n      description\n      placements {\n        definitionId\n        color\n        square\n      }\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListPieceSets {\n  medusaQueries {\n    pieceSets {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}"): (typeof documents)["query ListPieceSets {\n  medusaQueries {\n    pieceSets {\n      id\n      name\n      description\n      startingFen\n      isSystem\n      members {\n        slot\n        pieceDefinitionId\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ListPieces($all: Boolean) {\n  medusaQueries {\n    pieces(all: $all) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      createdBy\n      ownerName\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}"): (typeof documents)["query ListPieces($all: Boolean) {\n  medusaQueries {\n    pieces(all: $all) {\n      id\n      slug\n      name\n      description\n      isKing\n      promotionTargets\n      promotionRanks\n      moveStates\n      stateTransition\n      edgeReset\n      isSystem\n      createdBy\n      ownerName\n      sprite {\n        headKey\n        bodyKey\n        footKey\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query LobbySupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    boardLayouts {\n      id\n      name\n      description\n    }\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}"): (typeof documents)["query LobbySupport($ids: [ID!]!) {\n  gaiaQueries {\n    me {\n      id\n      username\n      personId\n    }\n  }\n  medusaQueries {\n    boardLayouts {\n      id\n      name\n      description\n    }\n    players(ids: $ids) {\n      id\n      username\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyGames($pagination: PaginationInput) {\n  medusaQueries {\n    myGames(pagination: $pagination) {\n      items {\n        id\n        code\n        boardLayoutName\n        status\n        finalState\n        creatorAccountId\n        whiteAccountId\n        blackAccountId\n        whitePlayer {\n          id\n          username\n        }\n        blackPlayer {\n          id\n          username\n        }\n        viewerSeat\n        result\n        winnerAccountId\n        moveCount\n        createdAt\n        startedAt\n        finishedAt\n        archivedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n      record {\n        wins\n        losses\n        draws\n        played\n      }\n    }\n  }\n}"): (typeof documents)["query MyGames($pagination: PaginationInput) {\n  medusaQueries {\n    myGames(pagination: $pagination) {\n      items {\n        id\n        code\n        boardLayoutName\n        status\n        finalState\n        creatorAccountId\n        whiteAccountId\n        blackAccountId\n        whitePlayer {\n          id\n          username\n        }\n        blackPlayer {\n          id\n          username\n        }\n        viewerSeat\n        result\n        winnerAccountId\n        moveCount\n        createdAt\n        startedAt\n        finishedAt\n        archivedAt\n      }\n      pageInfo {\n        page\n        size\n        totalPages\n        totalCount\n        hasNextPage\n        hasPreviousPage\n      }\n      record {\n        wins\n        losses\n        draws\n        played\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SaveBoardLayout($input: BoardLayoutInput!) {\n  medusaMutations {\n    saveBoardLayout(input: $input) {\n      message\n      boardLayout {\n        id\n        slug\n        name\n      }\n    }\n  }\n}"): (typeof documents)["mutation SaveBoardLayout($input: BoardLayoutInput!) {\n  medusaMutations {\n    saveBoardLayout(input: $input) {\n      message\n      boardLayout {\n        id\n        slug\n        name\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SavePiece($input: PieceInput!) {\n  medusaMutations {\n    savePiece(input: $input) {\n      message\n      piece {\n        id\n        slug\n        name\n      }\n    }\n  }\n}"): (typeof documents)["mutation SavePiece($input: PieceInput!) {\n  medusaMutations {\n    savePiece(input: $input) {\n      message\n      piece {\n        id\n        slug\n        name\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SavePieceSet($input: PieceSetInput!) {\n  medusaMutations {\n    savePieceSet(input: $input) {\n      message\n      pieceSet {\n        id\n        name\n      }\n    }\n  }\n}"): (typeof documents)["mutation SavePieceSet($input: PieceSetInput!) {\n  medusaMutations {\n    savePieceSet(input: $input) {\n      message\n      pieceSet {\n        id\n        name\n      }\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;