import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tenant } from "@/types";

const TOKEN_KEY = "glamedge_owner_token";
const TENANT_KEY = "glamedge_owner_tenant";

// Token is small and sensitive -> Keychain/Keystore via SecureStore.
// Tenant is a larger plain object with no secrets -> AsyncStorage (SecureStore
// backends have historically been unreliable above a couple KB per item).
export async function loadSession(): Promise<{ token: string | null; tenant: Tenant | null }> {
  const [token, tenantJson] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    AsyncStorage.getItem(TENANT_KEY),
  ]);
  return { token, tenant: tenantJson ? (JSON.parse(tenantJson) as Tenant) : null };
}

export async function saveSession(token: string, tenant: Tenant): Promise<void> {
  await Promise.all([SecureStore.setItemAsync(TOKEN_KEY, token), AsyncStorage.setItem(TENANT_KEY, JSON.stringify(tenant))]);
}

export async function saveTenant(tenant: Tenant): Promise<void> {
  await AsyncStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
}

export async function clearSession(): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), AsyncStorage.removeItem(TENANT_KEY)]);
}
