task :default => 'main.js'

file 'main.js' => FileList["*.ts"] do |t|
  sh "tsc --noImplicitAny --sourcemap --out main.js *.ts"
end
