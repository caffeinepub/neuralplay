import Int "mo:core/Int";
import Time "mo:core/Time";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Nat32 "mo:core/Nat32";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Types
  type TaskCategory = {
    #beginner;
    #intermediate;
    #advanced;
  };

  type UserProfile = {
    username : Text;
    email : Text;
    level : Nat;
    credits : Nat;
    streak : Nat;
    lastActiveDay : Int;
    badges : [Text];
    completedTaskIds : [Nat];
  };

  // Compare function for sorting
  module UserProfile {
    public func compare(a : UserProfile, b : UserProfile) : Order.Order {
      Nat.compare(b.credits, a.credits);
    };
  };

  type Task = {
    id : Nat;
    title : Text;
    description : Text;
    category : TaskCategory;
    creditReward : Nat;
    steps : [Text];
    isDaily : Bool;
  };

  type ContactMessage = {
    name : Text;
    email : Text;
    message : Text;
    timestamp : Int;
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let users = Map.empty<Principal, UserProfile>();
  let contactMessages = List.empty<ContactMessage>();
  let tasks = Map.empty<Nat, Task>();

  var nextTaskId = 1;
  var dailyChallengeTaskId : ?Nat = null;

  // Helper functions
  func calculateDayNumber() : Int {
    Time.now() / 86_400_000_000_000;
  };

  func updateLevel(currentLevel : Nat, credits : Nat) : Nat {
    if (credits >= 600) { 3 } else if (credits >= 300) { 2 } else if (credits >= 100) { 1 } else { 0 };
  };

  // Public API - Required profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func registerOrUpdateProfile(username : Text, email : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register or update profiles");
    };

    if (username.size() < 3) {
      Runtime.trap("Username too short");
    };
    if (email.size() < 5 or not email.contains(#char '@')) {
      Runtime.trap("Invalid email address");
    };

    // Check if user already has a profile
    let existingProfile = users.get(caller);
    let isNewProfile = switch (existingProfile) {
      case (null) { true };
      case (?_) { false };
    };

    let profile : UserProfile = switch (existingProfile) {
      case (null) {
        // New profile
        {
          username;
          email;
          level = 0;
          credits = 0;
          streak = 0;
          lastActiveDay = calculateDayNumber();
          badges = ["welcome"];
          completedTaskIds = [];
        };
      };
      case (?existing) {
        // Update existing profile
        {
          existing with
          username;
          email;
        };
      };
    };

    users.add(caller, profile);
  };

  public shared ({ caller }) func completeTask(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };

    if (taskId > nextTaskId or taskId == 0) {
      Runtime.trap("Task does not exist");
    };

    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        // Check if already completed
        let alreadyCompleted = profile.completedTaskIds.any(
          func(completed) { completed == taskId }
        );
        if (alreadyCompleted) {
          Runtime.trap("Task already completed");
        };

        // Get the actual task to get credit reward
        let taskOpt = tasks.get(taskId);
        let creditReward = switch (taskOpt) {
          case (?task) { task.creditReward };
          case (null) { 0 };
        };

        // Update streak
        let today = calculateDayNumber();
        let newStreak = if (today - profile.lastActiveDay == 1) {
          profile.streak + 1;
        } else {
          1;
        };

        let newCredits = profile.credits + creditReward;
        let newLevel = updateLevel(profile.level, newCredits);

        // Update badges
        let hasFirstTask = profile.completedTaskIds.size() == 0;
        let hasStreak3 = newStreak >= 3 and profile.streak < 3;
        let hasStreak7 = newStreak >= 7 and profile.streak < 7;
        let hasTasks10 = profile.completedTaskIds.size() + 1 >= 10 and profile.completedTaskIds.size() < 10;
        let hasTasks25 = profile.completedTaskIds.size() + 1 >= 25 and profile.completedTaskIds.size() < 25;
        let hasMaster = newLevel == 3 and profile.level < 3;

        let updatedBadges = List.empty<Text>();
        // Always add existing badges
        for (badge in profile.badges.values()) {
          updatedBadges.add(badge);
        };

        if (hasFirstTask) {
          updatedBadges.add("first_task");
        };
        if (hasStreak3) {
          updatedBadges.add("streak_3");
        };
        if (hasStreak7) {
          updatedBadges.add("streak_7");
        };
        if (hasTasks10) {
          updatedBadges.add("tasks_10");
        };
        if (hasTasks25) {
          updatedBadges.add("tasks_25");
        };
        if (hasMaster) {
          updatedBadges.add("master");
        };

        // Build updated task list
        let updatedCompletedTasks = List.empty<Nat>();
        for (taskId in profile.completedTaskIds.values()) {
          updatedCompletedTasks.add(taskId);
        };
        updatedCompletedTasks.add(taskId);

        // Update user profile
        let updatedProfile = {
          profile with
          lastActiveDay = today;
          level = newLevel;
          streak = newStreak;
          credits = newCredits;
          badges = updatedBadges.toArray();
          completedTaskIds = updatedCompletedTasks.toArray();
        };

        users.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getLeaderboard() : async [UserProfile] {
    // Public - anyone can view leaderboard
    users.values().toArray().sort();
  };

  public shared ({ caller }) func setDailyChallenge(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set daily challenge");
    };
    if (taskId > nextTaskId or taskId == 0) {
      Runtime.trap("Cannot set daily challenge");
    };
    dailyChallengeTaskId := ?taskId;
  };

  public shared ({ caller }) func submitContactMessage(name : Text, email : Text, message : Text) : async () {
    // Public - anyone including guests can submit contact messages
    let newMessage : ContactMessage = {
      name;
      email;
      message;
      timestamp = Time.now();
    };

    contactMessages.add(newMessage);
  };

  public query ({ caller }) func getContactMessages() : async [ContactMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view contact messages");
    };
    contactMessages.toArray();
  };

  public query ({ caller }) func getDailyChallenge() : async ?Task {
    // Public - anyone can view daily challenge
    switch (dailyChallengeTaskId) {
      case (?taskId) { tasks.get(taskId) };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    // Public - anyone can view all tasks
    tasks.values().toArray();
  };
};
