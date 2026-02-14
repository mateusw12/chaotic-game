import {
  SavedUserDto,
  SaveLoggedUserRequestDto,
  UserPermissionDto,
  UserRole,
} from "@/dto/user";
import {
  ABILITY_CATEGORIES,
  ABILITY_EFFECT_TYPES,
  ABILITY_STATS,
  ABILITY_TARGET_SCOPES,
  type AbilityCategory,
  type AbilityDto,
  type AbilityEffectType,
  type AbilityStat,
  type AbilityTargetScope,
  type CreateAbilityRequestDto,
  type UpdateAbilityRequestDto,
} from "@/dto/ability";
import {
  CREATURE_ELEMENTS,
  CREATURE_TRIBES,
  CreateCreatureRequestDto,
  CreatureDto,
  CreatureElement,
  CreatureTribe,
  UpdateCreatureRequestDto,
} from "@/dto/creature";
import { type UserDashboardDto, type UserWalletDto } from "@/dto/wallet";
import { createClient } from "@supabase/supabase-js";


type SupabaseUserRow = {
  id: string;
  role: UserRole;
  provider: string;
  provider_account_id: string;
  email: string;
  name: string | null;
  image_url: string | null;
  last_login_at: string;
  created_at: string;
  updated_at: string;
};

type SupabasePermissionUserRow = {
  id: string;
  name: string | null;
  email: string;
  image_url: string | null;
  role: UserRole;
  updated_at: string;
};

type SupabaseWalletRow = {
  id: string;
  user_id: string;
  coins: number;
  diamonds: number;
  created_at: string;
  updated_at: string;
};

type SupabaseCreatureRow = {
  id: string;
  name: string;
  image_file_id: string | null;
  image_url: string | null;
  tribe: CreatureTribe;
  power: number;
  courage: number;
  speed: number;
  wisdom: number;
  mugic: number;
  energy: number;
  dominant_elements: CreatureElement[];
  support_ability_id: string | null;
  support_ability_name: string | null;
  brainwashed_ability_id: string | null;
  brainwashed_ability_name: string | null;
  equipment_note: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseAbilityRow = {
  id: string;
  name: string;
  category: AbilityCategory;
  effect_type: AbilityEffectType;
  target_scope: AbilityTargetScope;
  stat: AbilityStat;
  value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SupabaseApiError = {
  code?: string;
  message: string;
};

function getSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapSupabaseUserRow(row: SupabaseUserRow): SavedUserDto {
  return {
    id: row.id,
    role: row.role,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    email: row.email,
    name: row.name,
    imageUrl: row.image_url,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabasePermissionUserRow(
  row: SupabasePermissionUserRow,
): UserPermissionDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    imageUrl: row.image_url,
    role: row.role,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseWalletRow(row: SupabaseWalletRow): UserWalletDto {
  return {
    id: row.id,
    userId: row.user_id,
    coins: row.coins,
    diamonds: row.diamonds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingTableError(error: SupabaseApiError): boolean {
  return error.code === "PGRST205";
}

function getUsersTableName() {
  return process.env.SUPABASE_USERS_TABLE ?? "users";
}

function getWalletsTableName() {
  return process.env.SUPABASE_WALLETS_TABLE ?? "user_wallets";
}

function getCreaturesTableName() {
  return process.env.SUPABASE_CREATURES_TABLE ?? "creatures";
}

function getAbilitiesTableName() {
  return process.env.SUPABASE_ABILITIES_TABLE ?? "abilities";
}

function getCreatureImagesBucketName() {
  return process.env.SUPABASE_CREATURE_IMAGES_BUCKET ?? "creature-images";
}

function sanitizeFileName(fileName: string) {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  return normalized.replace(/-+/g, "-");
}

function getCreatureImagePublicUrl(imageFileId: string | null): string | null {
  if (!imageFileId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const bucketName = getCreatureImagesBucketName();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(imageFileId);

  return publicUrl || null;
}

function isValidTribe(value: string): value is CreatureTribe {
  return CREATURE_TRIBES.includes(value as CreatureTribe);
}

function isValidElement(value: string): value is CreatureElement {
  return CREATURE_ELEMENTS.includes(value as CreatureElement);
}

function isValidAbilityCategory(value: string): value is AbilityCategory {
  return ABILITY_CATEGORIES.includes(value as AbilityCategory);
}

function isValidAbilityEffectType(value: string): value is AbilityEffectType {
  return ABILITY_EFFECT_TYPES.includes(value as AbilityEffectType);
}

function isValidAbilityStat(value: string): value is AbilityStat {
  return ABILITY_STATS.includes(value as AbilityStat);
}

function isValidAbilityTargetScope(value: string): value is AbilityTargetScope {
  return ABILITY_TARGET_SCOPES.includes(value as AbilityTargetScope);
}

function mapSupabaseCreatureRow(row: SupabaseCreatureRow): CreatureDto {
  const resolvedImageUrl = row.image_file_id
    ? getCreatureImagePublicUrl(row.image_file_id)
    : row.image_url;

  return {
    id: row.id,
    name: row.name,
    imageFileId: row.image_file_id,
    imageUrl: resolvedImageUrl,
    tribe: row.tribe,
    power: row.power,
    courage: row.courage,
    speed: row.speed,
    wisdom: row.wisdom,
    mugic: row.mugic,
    energy: row.energy,
    dominantElements: row.dominant_elements,
    supportAbilityId: row.support_ability_id,
    supportAbilityName: row.support_ability_name,
    brainwashedAbilityId: row.brainwashed_ability_id,
    brainwashedAbilityName: row.brainwashed_ability_name,
    equipmentNote: row.equipment_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseAbilityRow(row: SupabaseAbilityRow): AbilityDto {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    effectType: row.effect_type,
    targetScope: row.target_scope,
    stat: row.stat,
    value: row.value,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserByEmail(
  email: string,
): Promise<{ id: string; role: UserRole } | null> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("id,role")
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; role: UserRole }>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de consultar usuário (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return data ?? null;
}

export async function saveLoggedUserInSupabase(
  payload: SaveLoggedUserRequestDto,
): Promise<SavedUserDto> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { data, error } = await supabase
    .from(tableName)
    .upsert(
      {
        provider: payload.provider,
        provider_account_id: payload.providerAccountId,
        email: payload.email,
        name: payload.name,
        image_url: payload.imageUrl,
        last_login_at: new Date().toISOString(),
      },
      {
        onConflict: "provider,provider_account_id",
      },
    )
    .select(
      "id,role,provider,provider_account_id,email,name,image_url,last_login_at,created_at,updated_at",
    )
    .single<SupabaseUserRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de salvar usuários (veja README.md).`,
      );
    }

    throw new Error(`Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`);
  }

  return mapSupabaseUserRow(data);
}

export async function ensureDefaultAdminRoleByEmail(email: string): Promise<void> {
  const defaultAdminEmail = process.env.AUTH_DEFAULT_ADMIN_EMAIL;

  if (!defaultAdminEmail) {
    return;
  }

  if (email.toLowerCase() !== defaultAdminEmail.toLowerCase()) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { error } = await supabase
    .from(tableName)
    .update({ role: "admin" })
    .eq("email", email)
    .neq("role", "admin");

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de gerenciar roles (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }
}

export async function getUserRoleByEmail(email: string): Promise<UserRole | null> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("role")
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ role: UserRole }>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de consultar roles (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return data?.role ?? null;
}

export async function listUsersWithRoles(): Promise<UserPermissionDto[]> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("id,name,email,image_url,role,updated_at")
    .order("updated_at", { ascending: false })
    .returns<SupabasePermissionUserRow[]>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de listar permissões (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return (data ?? []).map(mapSupabasePermissionUserRow);
}

export async function updateUserRoleById(
  userId: string,
  role: UserRole,
): Promise<UserPermissionDto> {
  const supabase = getSupabaseAdminClient();
  const tableName = getUsersTableName();

  const { data, error } = await supabase
    .from(tableName)
    .update({ role })
    .eq("id", userId)
    .select("id,name,email,image_url,role,updated_at")
    .single<SupabasePermissionUserRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de atualizar permissões (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabasePermissionUserRow(data);
}

export async function ensureUserWalletInSupabase(
  userId: string,
): Promise<UserWalletDto> {
  const supabase = getSupabaseAdminClient();
  const tableName = getWalletsTableName();

  const { data, error } = await supabase
    .from(tableName)
    .upsert(
      {
        user_id: userId,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("id,user_id,coins,diamonds,created_at,updated_at")
    .single<SupabaseWalletRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de usar moedas e diamantes (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabaseWalletRow(data);
}

export async function getUserDashboardByEmail(
  email: string,
): Promise<UserDashboardDto | null> {
  const supabase = getSupabaseAdminClient();
  const usersTable = getUsersTableName();
  const walletsTable = getWalletsTableName();

  const { data: userRow, error: userError } = await supabase
    .from(usersTable)
    .select("id,name,image_url,role")
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{
      id: string;
      name: string | null;
      image_url: string | null;
      role: UserRole;
    }>();

  if (userError) {
    const supabaseError = userError as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${usersTable}. Crie a tabela antes de carregar o dashboard (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  if (!userRow) {
    return null;
  }

  const { data: walletRow, error: walletError } = await supabase
    .from(walletsTable)
    .select("id,user_id,coins,diamonds,created_at,updated_at")
    .eq("user_id", userRow.id)
    .maybeSingle<SupabaseWalletRow>();

  if (walletError) {
    const supabaseError = walletError as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${walletsTable}. Crie a tabela antes de carregar moedas e diamantes (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  const wallet = walletRow
    ? mapSupabaseWalletRow(walletRow)
    : await ensureUserWalletInSupabase(userRow.id);

  return {
    userName: userRow.name,
    userImageUrl: userRow.image_url,
    userRole: userRow.role,
    coins: wallet.coins,
    diamonds: wallet.diamonds,
  };
}

export async function listCreatures(): Promise<CreatureDto[]> {
  const supabase = getSupabaseAdminClient();
  const tableName = getCreaturesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select(
      "id,name,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at,support_ability:abilities!creatures_support_ability_id_fkey(name),brainwashed_ability:abilities!creatures_brainwashed_ability_id_fkey(name)",
    )
    .order("created_at", { ascending: false })
    .returns<
      Array<
        Omit<SupabaseCreatureRow, "support_ability_name" | "brainwashed_ability_name"> & {
          support_ability: { name: string } | null;
          brainwashed_ability: { name: string } | null;
        }
      >
    >();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar criaturas (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  const normalizedRows: SupabaseCreatureRow[] = (data ?? []).map((row) => ({
    ...row,
    support_ability_name: row.support_ability?.name ?? null,
    brainwashed_ability_name: row.brainwashed_ability?.name ?? null,
  }));

  return normalizedRows.map(mapSupabaseCreatureRow);
}

async function getAbilityById(abilityId: string): Promise<AbilityDto | null> {
  const supabase = getSupabaseAdminClient();
  const tableName = getAbilitiesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("id,name,category,effect_type,target_scope,stat,value,description,created_at,updated_at")
    .eq("id", abilityId)
    .maybeSingle<SupabaseAbilityRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela de habilidades antes de vincular criaturas (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return data ? mapSupabaseAbilityRow(data) : null;
}

export async function listAbilities(): Promise<AbilityDto[]> {
  const supabase = getSupabaseAdminClient();
  const tableName = getAbilitiesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .select("id,name,category,effect_type,target_scope,stat,value,description,created_at,updated_at")
    .order("created_at", { ascending: false })
    .returns<SupabaseAbilityRow[]>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar habilidades (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return (data ?? []).map(mapSupabaseAbilityRow);
}

export async function createAbility(
  payload: CreateAbilityRequestDto,
): Promise<AbilityDto> {
  if (!payload.name.trim()) {
    throw new Error("Nome da habilidade é obrigatório.");
  }

  if (!isValidAbilityCategory(payload.category)) {
    throw new Error("Categoria de habilidade inválida.");
  }

  if (!isValidAbilityEffectType(payload.effectType)) {
    throw new Error("Tipo de efeito inválido.");
  }

  if (!isValidAbilityTargetScope(payload.targetScope)) {
    throw new Error("Escopo de alvo inválido.");
  }

  if (!isValidAbilityStat(payload.stat)) {
    throw new Error("Atributo de habilidade inválido.");
  }

  if (payload.value < 0) {
    throw new Error("Valor da habilidade não pode ser negativo.");
  }

  const supabase = getSupabaseAdminClient();
  const tableName = getAbilitiesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      name: payload.name.trim(),
      category: payload.category,
      effect_type: payload.effectType,
      target_scope: payload.targetScope,
      stat: payload.stat,
      value: payload.value,
      description: payload.description?.trim() || null,
    })
    .select("id,name,category,effect_type,target_scope,stat,value,description,created_at,updated_at")
    .single<SupabaseAbilityRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar habilidades (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabaseAbilityRow(data);
}

export async function updateAbilityById(
  abilityId: string,
  payload: UpdateAbilityRequestDto,
): Promise<AbilityDto> {
  if (!payload.name.trim()) {
    throw new Error("Nome da habilidade é obrigatório.");
  }

  if (!isValidAbilityCategory(payload.category)) {
    throw new Error("Categoria de habilidade inválida.");
  }

  if (!isValidAbilityEffectType(payload.effectType)) {
    throw new Error("Tipo de efeito inválido.");
  }

  if (!isValidAbilityTargetScope(payload.targetScope)) {
    throw new Error("Escopo de alvo inválido.");
  }

  if (!isValidAbilityStat(payload.stat)) {
    throw new Error("Atributo de habilidade inválido.");
  }

  if (payload.value < 0) {
    throw new Error("Valor da habilidade não pode ser negativo.");
  }

  const supabase = getSupabaseAdminClient();
  const tableName = getAbilitiesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .update({
      name: payload.name.trim(),
      category: payload.category,
      effect_type: payload.effectType,
      target_scope: payload.targetScope,
      stat: payload.stat,
      value: payload.value,
      description: payload.description?.trim() || null,
    })
    .eq("id", abilityId)
    .select("id,name,category,effect_type,target_scope,stat,value,description,created_at,updated_at")
    .single<SupabaseAbilityRow>();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar habilidades (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabaseAbilityRow(data);
}

export async function deleteAbilityById(abilityId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const tableName = getAbilitiesTableName();

  const { error } = await supabase.from(tableName).delete().eq("id", abilityId);

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover habilidades (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }
}

export async function createCreature(
  payload: CreateCreatureRequestDto,
): Promise<CreatureDto> {
  if (!payload.name.trim()) {
    throw new Error("Nome da criatura é obrigatório.");
  }

  if (!isValidTribe(payload.tribe)) {
    throw new Error("Tribo inválida.");
  }

  if (payload.dominantElements.length === 0) {
    throw new Error("Selecione ao menos 1 elemento dominante.");
  }

  const invalidElement = payload.dominantElements.find(
    (element) => !isValidElement(element),
  );

  if (invalidElement) {
    throw new Error("Elemento dominante inválido.");
  }

  const statFields = [
    payload.power,
    payload.courage,
    payload.speed,
    payload.wisdom,
    payload.mugic,
    payload.energy,
  ];

  if (statFields.some((value) => value < 0)) {
    throw new Error("Os atributos da criatura não podem ser negativos.");
  }

  if (payload.supportAbilityId) {
    const supportAbility = await getAbilityById(payload.supportAbilityId);

    if (!supportAbility) {
      throw new Error("Habilidade de suporte não encontrada.");
    }

    if (supportAbility.category !== "support") {
      throw new Error("A habilidade selecionada não é do tipo support.");
    }
  }

  if (payload.brainwashedAbilityId) {
    const brainwashedAbility = await getAbilityById(payload.brainwashedAbilityId);

    if (!brainwashedAbility) {
      throw new Error("Habilidade brainwashed não encontrada.");
    }

    if (brainwashedAbility.category !== "brainwashed") {
      throw new Error("A habilidade selecionada não é do tipo brainwashed.");
    }
  }

  const supabase = getSupabaseAdminClient();
  const tableName = getCreaturesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .insert({
      name: payload.name.trim(),
      image_file_id: payload.imageFileId?.trim() || null,
      tribe: payload.tribe,
      power: payload.power,
      courage: payload.courage,
      speed: payload.speed,
      wisdom: payload.wisdom,
      mugic: payload.mugic,
      energy: payload.energy,
      dominant_elements: payload.dominantElements,
      support_ability_id: payload.supportAbilityId ?? null,
      brainwashed_ability_id: payload.brainwashedAbilityId ?? null,
      equipment_note: payload.equipmentNote?.trim() || null,
    })
    .select(
      "id,name,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at,support_ability:abilities!creatures_support_ability_id_fkey(name),brainwashed_ability:abilities!creatures_brainwashed_ability_id_fkey(name)",
    )
    .single<
      Omit<SupabaseCreatureRow, "support_ability_name" | "brainwashed_ability_name"> & {
        support_ability: { name: string } | null;
        brainwashed_ability: { name: string } | null;
      }
    >();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de cadastrar criaturas (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabaseCreatureRow({
    ...data,
    support_ability_name: data.support_ability?.name ?? null,
    brainwashed_ability_name: data.brainwashed_ability?.name ?? null,
  });
}

export async function updateCreatureById(
  creatureId: string,
  payload: UpdateCreatureRequestDto,
): Promise<CreatureDto> {
  if (!payload.name.trim()) {
    throw new Error("Nome da criatura é obrigatório.");
  }

  if (!isValidTribe(payload.tribe)) {
    throw new Error("Tribo inválida.");
  }

  if (payload.dominantElements.length === 0) {
    throw new Error("Selecione ao menos 1 elemento dominante.");
  }

  const invalidElement = payload.dominantElements.find(
    (element) => !isValidElement(element),
  );

  if (invalidElement) {
    throw new Error("Elemento dominante inválido.");
  }

  const statFields = [
    payload.power,
    payload.courage,
    payload.speed,
    payload.wisdom,
    payload.mugic,
    payload.energy,
  ];

  if (statFields.some((value) => value < 0)) {
    throw new Error("Os atributos da criatura não podem ser negativos.");
  }

  if (payload.supportAbilityId) {
    const supportAbility = await getAbilityById(payload.supportAbilityId);

    if (!supportAbility) {
      throw new Error("Habilidade de suporte não encontrada.");
    }

    if (supportAbility.category !== "support") {
      throw new Error("A habilidade selecionada não é do tipo support.");
    }
  }

  if (payload.brainwashedAbilityId) {
    const brainwashedAbility = await getAbilityById(payload.brainwashedAbilityId);

    if (!brainwashedAbility) {
      throw new Error("Habilidade brainwashed não encontrada.");
    }

    if (brainwashedAbility.category !== "brainwashed") {
      throw new Error("A habilidade selecionada não é do tipo brainwashed.");
    }
  }

  const supabase = getSupabaseAdminClient();
  const tableName = getCreaturesTableName();

  const { data, error } = await supabase
    .from(tableName)
    .update({
      name: payload.name.trim(),
      image_file_id: payload.imageFileId?.trim() || null,
      tribe: payload.tribe,
      power: payload.power,
      courage: payload.courage,
      speed: payload.speed,
      wisdom: payload.wisdom,
      mugic: payload.mugic,
      energy: payload.energy,
      dominant_elements: payload.dominantElements,
      support_ability_id: payload.supportAbilityId ?? null,
      brainwashed_ability_id: payload.brainwashedAbilityId ?? null,
      equipment_note: payload.equipmentNote?.trim() || null,
    })
    .eq("id", creatureId)
    .select(
      "id,name,image_file_id,image_url,tribe,power,courage,speed,wisdom,mugic,energy,dominant_elements,support_ability_id,brainwashed_ability_id,equipment_note,created_at,updated_at,support_ability:abilities!creatures_support_ability_id_fkey(name),brainwashed_ability:abilities!creatures_brainwashed_ability_id_fkey(name)",
    )
    .single<
      Omit<SupabaseCreatureRow, "support_ability_name" | "brainwashed_ability_name"> & {
        support_ability: { name: string } | null;
        brainwashed_ability: { name: string } | null;
      }
    >();

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de editar criaturas (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }

  return mapSupabaseCreatureRow({
    ...data,
    support_ability_name: data.support_ability?.name ?? null,
    brainwashed_ability_name: data.brainwashed_ability?.name ?? null,
  });
}

export async function deleteCreatureById(creatureId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const tableName = getCreaturesTableName();

  const { error } = await supabase.from(tableName).delete().eq("id", creatureId);

  if (error) {
    const supabaseError = error as SupabaseApiError;

    if (isMissingTableError(supabaseError)) {
      throw new Error(
        `Tabela não encontrada no Supabase: public.${tableName}. Crie a tabela antes de remover criaturas (veja supabase/schema.sql).`,
      );
    }

    throw new Error(
      `Erro Supabase [${supabaseError.code ?? "UNKNOWN"}]: ${supabaseError.message}`,
    );
  }
}

export async function uploadCreatureImageToStorage(payload: {
  fileName: string;
  fileBuffer: ArrayBuffer;
  contentType?: string;
}): Promise<{ path: string; publicUrl: string }> {
  const supabase = getSupabaseAdminClient();
  const bucketName = getCreatureImagesBucketName();

  const { data: existingBucket, error: getBucketError } = await supabase.storage.getBucket(bucketName);

  const bucketNotFound = Boolean(
    getBucketError
    && (
      (getBucketError as { statusCode?: number }).statusCode === 404
      || /bucket not found/i.test(getBucketError.message)
    ),
  );

  if (getBucketError && !bucketNotFound) {
    throw new Error(
      `Erro ao validar bucket de imagens [${getBucketError.name ?? "STORAGE"}]: ${getBucketError.message}`,
    );
  }

  if (!existingBucket || bucketNotFound) {
    const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: "10MB",
    });

    if (createBucketError && !/already exists/i.test(createBucketError.message)) {
      throw new Error(
        `Erro ao criar bucket de imagens [${createBucketError.name ?? "STORAGE"}]: ${createBucketError.message}`,
      );
    }
  }

  const safeFileName = sanitizeFileName(payload.fileName || "image");
  const path = `creatures/${new Date().getFullYear()}/${crypto.randomUUID()}-${safeFileName}`;

  const { error } = await supabase.storage.from(bucketName).upload(path, payload.fileBuffer, {
    contentType: payload.contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(
      `Erro ao enviar imagem para o Storage [${error.name ?? "STORAGE"}]: ${error.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(path);

  if (!publicUrl) {
    throw new Error("Não foi possível obter a URL pública da imagem.");
  }

  return { path, publicUrl };
}
