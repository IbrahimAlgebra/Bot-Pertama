vercel.json

path: endpoint yang akan diakses oleh Vercel. Nilainya api/index.js.

schedule: Ini adalah format cron untuk jadwalnya.
- "0 5 * * *" artinya: "Jalankan setiap hari pada jam 5 pagi UTC".
- "*/5 * * * *" artinya: "Jalankan setiap 5 menit".
- "0 * * * *" artinya: "Jalankan setiap jam".