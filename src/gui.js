/**
 * Created by Marcel Michelfelder on 19.08.2016.
 */

var Gui = function(player){
    var font = new pixelfont(),
         margin = 100,
         w = 400;

    function draw(){
        var weapon = player.$.weapon;
        context.drawImage(font.draw(weapon.name + ": " + weapon.getAmmo().ammo, 5, "green"),margin,cHeight - margin- 130);
        context.drawImage(font.draw("Grenades: " +player.$.grenadeCount, 5, "green"),margin,cHeight - margin- 90);
        if(player.$.hasPowerUp)context.drawImage(font.draw(player.$.hasPowerUp.name + ": " + player.$.hasPowerUp.charges, 5, "green"),margin,cHeight - margin- 50);
        context.drawImage(font.draw('score: ' + score,5, "green"),margin,margin);
        //context.drawImage(font.draw("Next Wave in: " + (Date.now()-timeUntilNextWave)/1000, 5, "green"),cWidth-margin-700,cHeight - margin- 50);
        drawHp();
        drawAmmo();
        if(player.$.hasPowerUp) drawPowerUp();
        if(isHacking) drawHack();
    }

    function drawBar(opts){
        var w = opts.w;
        var h = opts.h;
        var x = opts.x;
        var y = opts.y;
        var zoom = overallZoom/2;
        var ratio = opts.fill/opts.fillMax;
        if(opts.inverse){
            ratio = 1 - ratio;
        }

        if(opts.bg){

            context.fillStyle = '#000000';
            context.fillRect(x,y,w,h);

            context.fillStyle = opts.bg;
            context.fillRect(x+zoom,y+zoom,w-zoom*2,h-zoom*2);
        }

        context.fillStyle = opts.fg;
        context.fillRect(x+zoom-(opts.bg?0:1),y+zoom,(w-zoom*2)*ratio,h-zoom*2);
    }

    function drawHack(){
        drawBar({
             w : w,
             h : 20,
             x : cWidth/2-w/2,
             y : cHeight - margin - 20,
            bg : '#228822',
            fg : '#00ff00',
            fill : isHacking,
            fillMax : isHackingMax
        })
    }

    function drawHp(){
        drawBar({
             w : w,
             h : 20,
             x : cWidth/2-w/2,
             y : margin,
            bg : '#ff8888',
            fg : '#ff0000',
            fill : player.$.hp,
            fillMax : 1000
        });
        drawBar({
             w : w,
             h : 20,
             x : cWidth/2-w/2,
             y : margin,
            bg : null,
            fg : '#8d8fb4',
            fill : player.$.armor,
            fillMax : 1000
        })
    }
    function drawPowerUp(){
        drawBar({
             w : w,
             h : 20,
             x : cWidth/2-w/2,
             y : margin+60,
            bg : '#000022',
            fg : '#222288',
            fill : player.$.hasPowerUp.charges,
            fillMax : player.$.hasPowerUp.maxcharges
        });
    }
    function drawAmmo(){

        var weapon = player.$.weapon;
        var reload = weapon.getReloadProgress();
        var bg = '#3b321b',
            fg = '#ffd674',
            fill = weapon.getAmmo().reloadAmmo,
            fillMax = weaponsProto[weapon.name].reloadAmmo || weaponsProto[weapon.name].ammo;

        if(reload.reloadProgress){
            fg = "#ffffff";
            fill  = reload.reloadProgress;
            fillMax  = reload.reloadTime;
        }
        drawBar({
             w : w,
             h : 20,
             x : cWidth/2-w/2,
             y : margin + 30,
            bg : bg,
            fg : fg,
            fill : fill,
            fillMax : fillMax,
            inverse : reload.reloadProgress
        })
    }

    return {
        draw : draw
    }
};