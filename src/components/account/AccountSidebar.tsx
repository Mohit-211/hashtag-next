import { NAV_ITEMS } from "@/data/constants";
import { Section } from "@/data/types";

interface User {
  name?: string;
  email?: string;
}

interface Props {
  active: Section;
  onNavigate: (key: Section) => void;
  user: User | null;
}

export default function AccountSidebar({ active, onNavigate, user }: Props) {
  return (
    <aside className="lg:w-64 shrink-0">
      <div className="bg-card border border-border rounded-xl p-4 space-y-1">
        <div className="px-3 py-3 mb-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {user?.name}
          </p>

          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          const isActive =
            active === item.key &&
            item.key !== "orders" &&
            item.key !== "saved" &&
            item.key !== "logout";

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
