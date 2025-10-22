import type { ClassType } from "./models/player.js";

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

