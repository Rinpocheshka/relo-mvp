const fs = require('fs');
const f = 'src/app/components/CreateAnnouncementModal.tsx';
let c = fs.readFileSync(f,'utf8');

const oldSuccess = `              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Опубликовано!</h3>
                  <p className="text-muted-foreground">Ваше объявление уже в ленте.</p>
                </div>
              ) : (`;

const newSuccess = `              {success ? (
                isPending ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Отправлено на модерацию</h3>
                  <p className="text-muted-foreground">Объявление появится в ленте после проверки администратором.</p>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Опубликовано!</h3>
                  <p className="text-muted-foreground">Ваше объявление уже в ленте.</p>
                </div>
                )
              ) : (`;

c = c.replace(oldSuccess, newSuccess);
fs.writeFileSync(f, c, 'utf8');
console.log(c.includes('Отправлено на модерацию') ? 'done' : 'replace failed');