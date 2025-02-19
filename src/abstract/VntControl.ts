import {invoke} from "@tauri-apps/api/core";

export async function start_vnt(): Promise<void> {
    return await invoke("start_vnt")
}

export async function stop_vnt(): Promise<void> {
    return await invoke("stop_vnt")
}

export async function get_user_list(): Promise<User[]> {
    return await invoke<Array<User>>("get_user_list");
}

export async function fresh_user_list(): Promise<void> {
    return await invoke("fresh_user_list");
}

export async function get_running_status(): Promise<boolean> {
    return await invoke<boolean>("get_running_status");
}

export async function get_virtual_ip(): Promise<string> {
    return await invoke<string>("get_virtual_ip");
}

export type User = {
    ip: string,
    name: string,
    nat_traversal_type: string,
    status: boolean,
}