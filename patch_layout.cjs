const fs = require('fs');
const f = 'src/app/components/Layout.tsx';
let c = fs.readFileSync(f,'utf8');

// 1. Import isAdmin in Layout
c = c.replace(
  "  const { user, loading } = useAuth();",
  "  const { user, loading, isAdmin } = useAuth();\n  const [pendingCount, setPendingCount] = React.useState(0);"
);

// 2. Fetch pending count when admin is logged in (add after unreadCount effect)
const fetchPendingEffect = `
  useEffect(() => {
    if (!isAdmin) { setPendingCount(0); return; }
    const fetch = async () => {
      const { count } = await supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      setPendingCount(count ?? 0);
    };
    void fetch();
    const ch = supabase.channel('layout_moderation_count').on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => void fetch()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);
`;

c = c.replace(
  "  const isActive = (path: string) => location.pathname.startsWith(path);",
  fetchPendingEffect + "\n  const isActive = (path: string) => location.pathname.startsWith(path);"
);

// 3. Add Moderation link in desktop nav right side (before HeaderAuth)
c = c.replace(
  `              {/* Auth — Profile or Login */}
              <HeaderAuth unreadCount={unreadCount} />`,
  `              {/* Moderation link for admins */}
              {isAdmin && (
                <Link
                  to="/admin/moderation"
                  className={\`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all \${isActive('/admin/moderation') ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:bg-amber-50 border border-amber-200'}\`}
                >
                  {pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{pendingCount > 9 ? '9+' : pendingCount}</span>
                  )}
                  Модерация
                </Link>
              )}
              {/* Auth — Profile or Login */}
              <HeaderAuth unreadCount={unreadCount} />`
);

fs.writeFileSync(f, c, 'utf8');
console.log(c.includes('admin/moderation') ? 'done' : 'failed');