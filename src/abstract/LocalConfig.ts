import {invoke} from "@tauri-apps/api/core";

export type Config = {
    token: string,
    name: string,
    server_address_str: string,
    stun_server: Array<String> | null,
    device_id: string,
}

export async function get_config(): Promise<Config> {
    return await invoke("get_config") as Config;
}