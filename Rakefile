(ts_files = Dir["*.ts"]).each do |ts|
  task :default => ts.sub('.ts', '.js')
end

ts_files.each do |ts|
  file ts.sub('.ts', '.js') => ts do |t|
    sh "tsc --noImplicitAny --sourcemap #{ts}"
  end
end
