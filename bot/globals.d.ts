declare module "bun" {
    interface Env {
        readonly TOKEN: string;
        readonly BOARD_VIEW_SIZE: string;
        readonly BOARD_SCAN_SIZE: string;
        readonly CHEST_REFRESH_PERCENTAGE: string;
        readonly MOB_REFRESH_PERCENTAGE: string;
    }
}