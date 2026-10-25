/**
 * @fileoverview Imports Free-Chess SQLite export into Sun (Medusa) via GraphQL.
 * @module scripts/import-to-sun
 */

import { readFileSync } from 'node:fs';

const endpoint = process.env.GRAPHQL_ENDPOINT || 'http://localhost:8083/graphql';
const token = process.env.SUN_ADMIN_TOKEN;
if (!token) {
  console.error('SUN_ADMIN_TOKEN is required');
  process.exit(1);
}

const bundle = JSON.parse(readFileSync('/tmp/opencode/free-chess-export.json', 'utf8'));

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Client-Id': 'free-chess',
      'X-Client-Secret': process.env.CLIENT_SECRET || '',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(', '));
  if (!json.data) throw new Error('No data returned');
  return json.data;
}

// Pieces
const spriteByPiece = new Map<number, { head_key: string; body_key: string; foot_key: string }>();
for (const s of bundle.sprites as { piece_definition_id: number; head_key: string; body_key: string; foot_key: string }[]) {
  spriteByPiece.set(s.piece_definition_id, s);
}

for (const p of bundle.pieces as Record<string, unknown>[]) {
  const sprite = spriteByPiece.get(Number(p.id));
  const input = {
    slug: p.slug,
    name: p.name,
    description: p.description ?? null,
    isKing: Boolean(p.is_king),
    promotionTargets: JSON.parse(String(p.promotion_targets || '[]')),
    promotionRanks: JSON.parse(String(p.promotion_ranks || '[]')),
    moveStates: JSON.parse(String(p.move_states || '[]')),
    stateTransition: p.state_transition,
    edgeReset: Boolean(p.edge_reset),
    sprite: {
      headKey: sprite?.head_key ?? 'default',
      bodyKey: sprite?.body_key ?? 'default',
      footKey: sprite?.foot_key ?? 'default',
    },
  };
  const mutation = `mutation SavePiece($input: PieceInput!) { medusaMutations { savePiece(input: $input) { piece { id slug } } } }`;
  const data = await gql<{ medusaMutations: { savePiece: { piece: { id: string; slug: string } } } }>(
    mutation,
    { input },
  );
  console.log('Saved piece', data.medusaMutations.savePiece.piece.slug);
}

// Piece sets
for (const s of bundle.sets as Record<string, unknown>[]) {
  // ids are legacy ints; skip member linking for now
  const input = {
    name: s.name,
    description: s.description ?? null,
    startingFen: s.starting_fen,
    members: [],
  };
  const mutation = `mutation SavePieceSet($input: PieceSetInput!) { medusaMutations { savePieceSet(input: $input) { pieceSet { id name } } } }`;
  const data = await gql<{ medusaMutations: { savePieceSet: { pieceSet: { id: string; name: string } } } }>(
    mutation,
    { input },
  );
  console.log('Saved set', data.medusaMutations.savePieceSet.pieceSet.name);
}

// Board layouts
for (const l of bundle.layouts as Record<string, unknown>[]) {
  const input = {
    slug: l.slug,
    name: l.name,
    description: l.description ?? null,
    placements: JSON.parse(String(l.placements || '[]')),
  };
  const mutation = `mutation SaveBoardLayout($input: BoardLayoutInput!) { medusaMutations { saveBoardLayout(input: $input) { boardLayout { id slug } } } }`;
  const data = await gql<{ medusaMutations: { saveBoardLayout: { boardLayout: { id: string; slug: string } } } }>(
    mutation,
    { input },
  );
  console.log('Saved layout', data.medusaMutations.saveBoardLayout.boardLayout.slug);
}

console.log('Import complete');