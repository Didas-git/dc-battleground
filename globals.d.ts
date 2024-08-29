declare module "bun" {
    interface Env {
        TOKEN: string;
        BOARD_SIZE: string;
        BOARD_VIEW_SIZE: string;
        BOARD_SCAN_SIZE: string;
        CHEST_REFRESH_PERCENTAGE: string;
        MOB_REFRESH_PERCENTAGE: string;
    }
}