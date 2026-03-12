export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type UserCapabilities = {
    viewUsers: boolean;
    createUsers: boolean;
    updateUsers: boolean;
    deleteUsers: boolean;
    assignRoles: boolean;
    assignPermissions: boolean;
    viewNadraVerifications: boolean;
    viewAllNadraVerifications: boolean;
    createNadraVerifications: boolean;
    updateNadraVerifications: boolean;
    deleteNadraVerifications: boolean;
    callNadraApi: boolean;
};

export type Auth = {
    user: User;
    roles: string[];
    permissions: string[];
    can: UserCapabilities;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
