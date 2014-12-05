task :default => 'main.js'

task :clean do
  sh "rm *.js *.map"
end

file 'main.js' => FileList["*.ts"] do |t|
  sh "tsc --noImplicitAny --sourcemap --out main.js *.ts"
end
