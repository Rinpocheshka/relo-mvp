const fs = require('fs');
const f = 'src/app/components/Layout.tsx';
let c = fs.readFileSync(f,'utf8');

// Replace the right-side div to include moderation link
const oldStr = "            {/* Right side */}\r\n            <div className=\"hidden md:flex items-center gap-2 flex-shrink-0 ml-auto xl:ml-0\">\r\n              {/* Auth \u2014 Profile or Login */}\r\n              <HeaderAuth unreadCount={unreadCount} />\r\n            </div>";

const newStr = `            {/* Right side */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-auto xl:ml-0">
              {/* Moderation link for admins */}
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
              {/* Auth \u2014 Profile or Login */}
              <HeaderAuth unreadCount={unreadCount} />
            </div>`;

if (c.includes("Auth \u2014 Profile or Login")) {
  c = c.replace(oldStr, newStr);
  fs.writeFileSync(f, c, 'utf8');
  console.log(c.includes('admin/moderation') ? 'done' : 'replace failed');
} else {
  console.log('target string not found in file');
}