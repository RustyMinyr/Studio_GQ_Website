<?php
require '/var/www/html/vendor/autoload.php';
$app=require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$runtime=json_decode(file_get_contents('/tmp/sgq-runtime.json'),true,512,JSON_THROW_ON_ERROR);
$template=App\Models\Application::where('uuid','nisrzrcmiovakeykswg1b8nr')->firstOrFail();
$project=App\Models\Project::firstOrCreate(['name'=>'Studio GQ','team_id'=>0],['uuid'=>Illuminate\Support\Str::random(24),'description'=>'Studio GQ website, isolated SQLite bookings and encrypted recovery']);
$project->uuid=strtolower($project->uuid);$project->save();
foreach(['staging','production'] as $mode) {
 $environment=App\Models\Environment::firstOrCreate(['project_id'=>$project->id,'name'=>$mode],['uuid'=>Illuminate\Support\Str::random(24)]);
 $environment->uuid=strtolower($environment->uuid);$environment->save();
 $destination=App\Models\StandaloneDocker::firstOrCreate(['server_id'=>0,'network'=>'studio-gq-'.$mode],['name'=>'Studio GQ '.$mode,'uuid'=>Illuminate\Support\Str::random(24)]);
 $a=App\Models\Application::where('environment_id',$environment->id)->where('name','studio-gq-'.$mode)->first();
 if(!$a) {
   $a=new App\Models\Application;
   $a->fill($template->only(['build_pack','destination_type','source_type','source_id','base_directory','dockerfile_location','ports_exposes','health_check_enabled','health_check_method','health_check_scheme','health_check_host','health_check_return_code','health_check_interval','health_check_timeout','health_check_retries','health_check_start_period']));
   $a->uuid=Illuminate\Support\Str::random(24);$a->name='studio-gq-'.$mode;$a->environment_id=$environment->id;
   $a->git_repository='RustyMinyr/Studio_GQ_Website';$a->git_branch='codex/studio-gq-coolify';
   $a->destination_id=$destination->id;$a->fqdn=null;$a->ports_mappings=null;
   $a->custom_docker_run_options=null;$a->health_check_path='/api/health';$a->health_check_port='3000';$a->save();
 }
 $a->settings->is_consistent_container_name_enabled=true;
 $a->uuid=strtolower($a->uuid);$a->save();
 $a->settings->is_preview_deployments_enabled=false;
 $a->settings->is_auto_deploy_enabled=false;$a->settings->save();
 App\Models\EnvironmentVariable::withoutEvents(function()use($a,$runtime,$mode){
  $values=$runtime;
  if($mode==='staging') {unset($values['RESEND_API_KEY']);$values['CREW_PORTAL_PASSWORD']='migration-test-password-private';$values['CREW_SESSION_SECRET']=bin2hex(random_bytes(32));}
  $values['STUDIO_DATABASE_PATH']='/app/data/studio-gq.db';$values['APP_ORIGIN']=$mode==='production'?'https://www.studiogq.co.za':'http://localhost:3042';
  $values['EMAIL_DELIVERY_DISABLED']='1';$values['TRUST_COOLIFY_PROXY']='1';
  foreach($values as $key=>$value) {
   $v=App\Models\EnvironmentVariable::firstOrNew(['resourceable_type'=>App\Models\Application::class,'resourceable_id'=>$a->id,'key'=>$key,'is_preview'=>false]);
   if(!$v->exists)$v->uuid=Illuminate\Support\Str::random(24);
   $v->fill(['value'=>$value,'is_runtime'=>true,'is_buildtime'=>false,'is_literal'=>true,'version'=>config('constants.coolify.version')]);$v->save();
  }
 });
 if(!$a->fileStorages()->where('mount_path','/app/data')->exists()) {
  $mount=App\Models\Application::where('uuid','bwpnstgqinyepmnp5rzjtkr8')->firstOrFail()->fileStorages()->where('mount_path','/app/data')->firstOrFail()->replicate();
  $mount->fs_path='/srv/studio-gq/'.$mode.'/data';$mount->mount_path='/app/data';$a->fileStorages()->save($mount);
 }
 echo json_encode(['project'=>$project->uuid,'environment'=>$environment->uuid,'app'=>$a->uuid,'mode'=>$mode,'branch'=>$a->git_branch,'network'=>$destination->network])."\n";
}
