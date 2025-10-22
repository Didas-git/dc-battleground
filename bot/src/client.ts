import type { ClassType } from "./models/player.js";

const BASE_URL = "http://localhost:3000/api/";
const version = "v1";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function makeRequest(
    method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT",
    path: string,
    headers: Record<string, string>
) {
    const opts: RequestInit = {
        method,
        headers
    };

    return fetch(`${BASE_URL}${version}/${path}`, opts);
}

export const enum ProfileStatus {
    Success,
    Error,
    /** Usually failed allocations */
    Failure
}

export interface Profile {
    name: string;
    class: ClassType;
    xp: {
        level: number,
        xp: number
    };
}

export async function createProfile(serverId: string, memberId: string, name: string, classType: ClassType): Promise<ProfileStatus> {
    const res = await makeRequest("PUT", `profile/create/${serverId}/${memberId}/${name}/${classType}`, {});
    switch (res.status) {
        case 200:
            return ProfileStatus.Success;
        case 400:
            return ProfileStatus.Error;
        default:
            return ProfileStatus.Failure;
    }
}

export async function profileDisplay(serverId: string, memberId: string): Promise<[ProfileStatus.Success, Profile] | [ProfileStatus]> {
    const res = await makeRequest("GET", `profile/display/${serverId}/${memberId}`, {});
    switch (res.status) {
        case 200:
            return [ProfileStatus.Success, await res.json()];
        case 404:
            return [ProfileStatus.Error];
        default:
            return [ProfileStatus.Failure];
    }
}

export const enum ViewBoardStatus {
    Success,
    NoPlayer,
    /** Usually failed allocations */
    Failure
}

export interface BoardView {
    position: {
        layer: number,
        name: string,
        x: number,
        y: number
    };
    map: string;
}

export async function viewBoard(serverId: string, memberId: string, viewSize?: number): Promise<[ViewBoardStatus.Success, BoardView] | [ViewBoardStatus]> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const res = await makeRequest("GET", `board/position/${serverId}/${memberId}`, typeof viewSize === "undefined" ? {} : { "view-size": viewSize.toString() });
    switch (res.status) {
        case 200:
            return [ViewBoardStatus.Success, await res.json()];
        case 404:
            return [ViewBoardStatus.NoPlayer];
        default:
            return [ViewBoardStatus.Failure];
    }
}

export async function scanBoard(serverId: string, memberId: string, scannerRadius?: number): Promise<[ViewBoardStatus.Success, string] | [ViewBoardStatus]> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const res = await makeRequest("GET", `board/scan-from/${serverId}/${memberId}`, typeof scannerRadius === "undefined" ? {} : { "scanner-radius": scannerRadius.toString() });
    switch (res.status) {
        case 200:
            return [ViewBoardStatus.Success, await res.text()];
        case 404:
            return [ViewBoardStatus.NoPlayer];
        default:
            return [ViewBoardStatus.Failure];
    }
}

export const enum RefreshStatus {
    Success,
    Error,
    NoLayerInfo,
    /** Usually failed allocations */
    Failure
}

/** Caution!! This might overflow in some high number cases as zig uses u64 */
export interface RefreshStats {
    chests: number;
    mobs: number;
    took: number;
}

export async function refreshBoard(serverId: string, layer: number): Promise<[RefreshStatus.Success, RefreshStats] | [RefreshStatus]> {
    const res = await makeRequest("PUT", `board/refresh/${serverId}/${layer}`, {});
    switch (res.status) {
        case 200:
            return [RefreshStatus.Success, await res.json()];
        case 400:
            return [RefreshStatus.Error];
        case 404:
            return [RefreshStatus.NoLayerInfo];
        default:
            return [RefreshStatus.Failure];
    }
}
