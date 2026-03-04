import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: bigint;
    title: string;
    description: string;
    isDaily: boolean;
    steps: Array<string>;
    creditReward: bigint;
    category: TaskCategory;
}
export interface ContactMessage {
    name: string;
    email: string;
    message: string;
    timestamp: bigint;
}
export interface UserProfile {
    streak: bigint;
    lastActiveDay: bigint;
    credits: bigint;
    username: string;
    completedTaskIds: Array<bigint>;
    badges: Array<string>;
    email: string;
    level: bigint;
}
export enum TaskCategory {
    intermediate = "intermediate",
    beginner = "beginner",
    advanced = "advanced"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeTask(taskId: bigint): Promise<void>;
    getAllTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContactMessages(): Promise<Array<ContactMessage>>;
    getDailyChallenge(): Promise<Task | null>;
    getLeaderboard(): Promise<Array<UserProfile>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerOrUpdateProfile(username: string, email: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setDailyChallenge(taskId: bigint): Promise<void>;
    submitContactMessage(name: string, email: string, message: string): Promise<void>;
}
