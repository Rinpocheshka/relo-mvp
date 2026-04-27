const fs = require('fs');
const f = 'src/app/components/Layout.tsx';
let c = fs.readFileSync(f,'utf8');

// Add moderation link + pending badge before HeaderAuth
const oldStr = "              {/* Auth - Profile or Login */}\r\n              <HeaderAuth unreadCount={unreadCount} />";
const newStr = `              {/* Moderation link for admins */}
              {isAdmin && (
                <Link
                  to="/admin/moderation"
                  className={\`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all \${isActive('/admin/moderation') ? 'bg-amber-100 text-amber-700' : 'text-amber-600 hover:bg-amber-50 border border-amber-200'}\`}
                >
                  {pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">{pendingCount > 9 ? '9+' : pendingCount}</span>
                  )}
                  \u{1F527} Модерация
                </Link>
              )}
              {/* Auth - Profile or Login */}
              <HeaderAuth unreadCount={unreadCount} />`;
c = c.replace(oldStr, newStr);
fs.writeFileSync(f, c, 'utf8');
console.log(c.includes('admin/moderation') ? 'done' : 'failed - string not found');