<?php
require '/var/www/html/vendor/autoload.php';
$app=require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
foreach(App\Models\Application::all() as $a) echo json_encode($a->only(['id','uuid','name','git_repository','git_branch','build_pack','destination_type','destination_id','source_type','source_id','environment_id','dockerfile_location','docker_registry_image_name','docker_registry_image_tag']))."\n";
foreach(App\Models\Project::all() as $p) echo json_encode(['project'=>$p->only(['id','uuid','name','team_id']),'environments'=>$p->environments->map->only(['id','uuid','name'])])."\n";
