import { Link, useRouter } from "@tanstack/react-router";
import {
  CircleDot,
  MessageCircle,
  Radio,
  Users,
  UsersRound,
} from "lucide-react";

const NAV_ITEMS = [
  {
    path: "/chats",
    icon: MessageCircle,
    label: "Chats",
    ocid: "nav.chats.link",
  },
  {
    path: "/channels",
    icon: Radio,
    label: "Channels",
    ocid: "nav.channels.link",
  },
  {
    path: "/stories",
    icon: CircleDot,
    label: "Stories",
    ocid: "nav.stories.link",
  },
  {
    path: "/contacts",
    icon: Users,
    label: "Contacts",
    ocid: "nav.contacts.link",
  },
  {
    path: "/groups",
    icon: UsersRound,
    label: "Groups",
    ocid: "nav.groups.link",
  },
];

export default function BottomNav() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border z-50"
      style={{ boxShadow: "0 -1px 8px oklch(0.15 0.03 145 / 0.08)" }}
    >
      <div className="flex items-center justify-around h-[60px] px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.path ||
            (item.path !== "/chats" && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              data-ocid={item.ocid}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Icon
                size={22}
                style={{
                  color: isActive
                    ? "oklch(0.52 0.155 152)"
                    : "oklch(0.55 0.03 145)",
                  strokeWidth: isActive ? 2.5 : 1.8,
                  transition: "color 0.15s ease",
                }}
              />
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{
                  color: isActive
                    ? "oklch(0.52 0.155 152)"
                    : "oklch(0.55 0.03 145)",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "oklch(0.52 0.155 152)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
