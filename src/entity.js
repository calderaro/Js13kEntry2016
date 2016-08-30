/**
 * Created by Marcel Michelfelder on 14.08.2016.
 */


var entity = function(opts,cb) {
    idCounter++;

    var $ = {
        hp:0,
        armor:0,
        id :idCounter,
    }
    var x,
        y,
        w = 1,
        h = 1,
        originId,
        sX,
        sY,
        vx,
        vy,
        pX,
        pY,
        ai,
        b,
        startCd = Dn(),
        startCdAdd = 2000,
        hasPowerUp,
        isHovering,
        isPowerUp,
        hoverDelta = 0,
        angleRadians = 0,
        speed,
        hacked = 0,
        maxHp = 0,
        damage = 0,
        d,
        lastPositions = [],
        lastShiftPositions = [],
        hitCd = 200,
        gotHit,
        shootThrough,
        beingDestroyed,
        ticksPerFrame = 0,
        splinterSelf,
        shift = 0,
        glitchCooldown = 0,
        numberOfCols = 1,
        numberOfRows = 1,
        frameIndex = 0,
        tickCount = 0,
        weaponIndex = 0,
        weapons = {},
        sprites,
        hitSprites,
        toggleAnimation,
        flip = 1,
        flop,
        isShooting,
        zoom = 1,
        offsetY = 0,
        visible = false,
        that,
        exports = {
            init: init,
            switchToWeapon: switchToWeapon,
            draw: draw,
            update: update,
            switchWeapon: switchWeapon,
            moveX: moveX,
            moveY: moveY,
            shoot: shoot,
            throws: throws,
            getBounding: getBounding,
            getPos: getPos,
            getDim: getDim,
            dealDamage: dealDamage,
            getRealPos: getRealPos,
            setRef: setRef,
            getRef: getRef,
            setHp: setHp,
            addHp: addHp,
            getPowerUp: getPowerUp,
            $ :$,
            giveWeapon : giveWeapon,
            usePowerup : usePowerup,
            givePowerup : givePowerup,
            deleteItem : deleteItem,
            isPowerupFnct : function(){
                return isPowerUp;
            },
            hack : function(){
                hacked += powerUpMultiplier(true,1);
                if(++hacked > isHackingMax){
                    player.addHp(100);
                    deleteItem();
                } else {
                    return hacked;
                }

            }
        },
        isBullet = false,
        isGrenade = false,
        gDt = 0,
        gDtT = 0,
        isBot = false,
        isCollectable = false,
        isGlitch = false;




    if (opts) {
        init(opts, cb)
    }


    function init(opts) {
        // Create sprite sheet
        $.name = opts.name;
        $.isPlayer = $.name == 'player';
        isBullet = $.name == 'bullet' || $.name == 'grenade';
        isGrenade = $.name == 'grenade';
        isGlitch = $.name == 'glitch';
        $.isEnemy = !!($.name.match(/enemy/) || $.name.match(/drone/));
        isCollectable = opts.isCollectable;
        isPowerUp = opts.isPowerUp;

        isHovering = $.name.match(/drone/) || isCollectable;
        $.isItem = $.name.match(/crate/);

        isBot = opts.bot;

        if(isGlitch)
            toggleAnimation = true;


        if (!isBullet) {
            var obj = proto[$.name];
            h = obj.h;
            w = obj.w;
            $.hp = opts.hp || obj.hp;
            maxHp = $.hp;
            sprites = obj.sprites;
            hitSprites = obj.hitSprites;
            numberOfCols = sprites[0].length;
            numberOfRows = sprites.length;

            if(isBot || $.isPlayer){
                var weaponname = obj.weapon;
                var weaponMod = obj.weaponMod;
                $.weapon = weapons[weaponname] = new Weapon(weaponsProto[weaponname], $.id, weaponMod, $.isPlayer);
            }


            if(!$.isPlayer)
                splinterSelf = new splinter(sprites[0][0]);

        } else {
            originId = opts.id;
            speed = opts.speed;
            damage = opts.damage;
            shootThrough = opts.shootThrough;
            shift = opts.shift;
            d = opts.start;
        }


        x = sX = opts.x;
        y = sY = opts.y;
        vx = opts.vx;
        vy = opts.vy;
        ticksPerFrame = 4;
            zoom = overallZoom;
        if(isBullet)
            zoom = 10;

        if(isGrenade){
            gDtT = dist(sX,sY,vx,vy)/1.5,
                angleRadians = getAngleBetweenTwoPoints(sX,sY,vx,vy);
            b = new Bezier({x:sX,y:sY},{x:Math.cos(angleRadians)*gDtT+sX, y:Math.sin(angleRadians)*gDtT+sY-300},{x:vx,y:vy});
            gDtT /= 10;
        }

    }

    function switchWeapon(r){
        weaponIndex += r;
        var tmpWeapon;
        while(!tmpWeapon){

            if(weaponIndex < 0)
                weaponIndex = weaponOrder.length + weaponIndex;
            weaponIndex = weaponIndex.mod(weaponOrder.length);
            //console.log(weapons,weapons[weaponOrder[weaponIndex]],weaponOrder[weaponIndex]);
            tmpWeapon = weapons[weaponOrder[weaponIndex]];
            weaponIndex += r;
        }
        $.weapon = tmpWeapon;
        weaponIndex -= r;
    }


    function update(pPos){
        pX = pPos.x;
        pY = pPos.y;

        lastPositions.unshift({x:x,y:y});
        lastPositions.splice(10,1);

        if(isGlitch){
            glitchCooldown++;
            if(glitchCooldown > 150){
                //var X = getRandomArbitrary(-1,1)*cWidth/2 + pX;
                //var Y = getRandomArbitrary(-1,1)*cHeight/2 + pY;
                var X = getRandomArbitrary(-1,1)*5*zoom + x;
                var Y = getRandomArbitrary(-1,1)*5*zoom + y;
                createEntity({
                    //name : 'drone',
                    name : getRandomElementInArray(['drone','drone1','drone2']),
                    x: X,
                    y: Y,
                    bot: true,
                },[entities,enemies])
                glitchCooldown = 0;
            }
        }


        if(startCd + startCdAdd < Dn())
            if(ai) {
                ai.update(pPos);
            }


        if(toggleAnimation)
            tickCount += 1;

        if($.isPlayer) ticksPerFrame = pTicksPerFrame;

        if (tickCount > ticksPerFrame) {

            tickCount = 0;

            // If the current frame index is in range
            if (frameIndex < numberOfCols - 1) {
                // Go to the next frame
                frameIndex += 1;
            } else {
                frameIndex = 0;
            }
        }

        if(isBullet){
            if(isGrenade){
                //gDtT
                x = b.x(gDt/gDtT);
                y = b.y(gDt/gDtT);
                gDt++
                if(gDt>gDtT){
                    console.log("explode");
                    bullets.splice(bullets.indexOf(that),1);
                }

            } else {
                d+=speed;
                var dTemp = d;
                for(var i=0; i<shift; i++){
                    lastShiftPositions.unshift({x:vx * dTemp + sX,y:vy * dTemp + sY});
                    lastShiftPositions.splice(shift,1);
                    dTemp--;
                }

                x = vx * d + sX;
                y = vy * d + sY;
                var ent;
                for(var i in entities){
                    ent = entities[i];
                    if($.id == ent.$.id || originId == ent.$.id || ent.$.hp <= 0)
                        continue;

                    var x2 = ent.getPos().x;
                    var y2 = ent.getPos().y;
                    var w2 = ent.getBounding().w;
                    var h2 = ent.getBounding().h;
                    if(hits(x,y,w,h,x2,y2,w2,h2) && (ent.$.isItem ||ent.$.isPlayer || (ent.$.isEnemy && originId == player.$.id))){
                        if(!shootThrough)
                            bullets.splice(bullets.indexOf(that),1);
                        ent.dealDamage(damage);
                        break;
                    }
                }
            }

        }


        // collect items
        if($.isPlayer){
            var ent;
            var hitGlitch = 0;
            for(var i in collectables){
                ent = collectables[i];

                var x2 = ent.getPos().x;
                var y2 = ent.getPos().y;
                var w2 = ent.getBounding().w;
                var h2 = ent.getBounding().h;
                if(hits(x-w*zoom/4,y-h*zoom/2,w*zoom/2,h*zoom/2,x2,y2,w2,h2)){
                    var entName = ent.$.name;
                    if(entName == 'glitch') {
                        hitGlitch = ent.hack();
                    } else if(ent.isPowerupFnct()){
                        player.givePowerup(entName);
                        ent.deleteItem();
                    } else {
                        player.giveWeapon(entName);
                        ent.deleteItem();
                    }

                    //collectables.splice(collectables.indexOf(that),1);
                    //context.fillRect((cWidth/2)+x2-pX,(cHeight/2)+y2-pY,w2,h2);
                    //context.fillRect((cWidth/2)+w,(cHeight/2)+y-pY,-w/2,-h/2);
                    //context.fillRect((cWidth/2)+w/4*zoom,(cHeight/2)+y-pY,-w*zoom/2,-h*zoom/2);
                    break;
                    //todo: shoot through?
                }
            }
            isHacking = hitGlitch;
        }

        if($.weapon)
            $.weapon.reload();

        //todo: in Ai einbauen
        //if($.isEnemy){
        //    shoot(true, {x:pX, y:pY});
        //}



        var dst = dist(pX,pY,x,y);
        if(dst > cWidth*1.5 || ((isBullet || $.isItem) && dst > cHeight)) {
            deleteItem();
        }

        return exports;
    }

    function deleteItem(){
        if(isBullet){
            bullets.splice(bullets.indexOf(that),1);
        } else {
            entities.splice(entities.indexOf(that),1);
            if($.isEnemy)
                score += maxHp;
            if(isGlitch)
                score += 100;

            if($.isItem)
                items.splice(items.indexOf(that),1);
            if(isCollectable || isGlitch)
                collectables.splice(collectables.indexOf(that),1);
            if($.isEnemy)
                enemies.splice(enemies.indexOf(that),1);


        }
    }


    function draw() {

        // Draw the animation
        if(isShooting && !isHovering) offsetY = 1; else offsetY = 0;
        if(!toggleAnimation) frameIndex = 0;

        //var posX = $.isPlayer ? cWidth/2 : x-pX;
        //var posY =  $.isPlayer ? cHeight/2 : y-pY;
        //var posX = $.isPlayer ? cWidth/2 : (cWidth/2);
        //var posY =  $.isPlayer ? cHeight/2 : (cHeight/2);
        var posX = $.isPlayer ? cWidth/2 : (cWidth/2)+x-pX;
        var posY = $.isPlayer ? cHeight/2 : (cHeight/2)+y-pY;
        //if($.isEnemy){
        //    console.log(posX,posY);
        //}
        var delta = (gotHit - Dn()) / hitCd;


       drawSprite(
           isBullet ? false : sprites[offsetY][frameIndex],
           //todo: only player
            posX,
           posY,
            0,
           isBullet || isCollectable || isGlitch ? false : {
               img : hitSprites[offsetY][frameIndex],
               alpha : delta
           });


        toggleAnimation = isGlitch || 0;
        return exports;
    }

    function drawSprite(sprite, X, Y, deg, tintedImage) {
        context.save();
        var flopScale;

        if(isHovering)
            Y += Sin(hoverDelta++ /7)*5;
            X += zoom*(w/4);

        if(flop) flopScale = -1; else flopScale = 1;
        context.scale(flip, flopScale);
        X *= flip;
        if(flip == -1) X += w * zoom / 2;
        Y *= flopScale;



        // Draw the image
        if(!isBullet){
            if(beingDestroyed){
                var splinterImg = splinterSelf.draw();
                var finished = splinterSelf.finished();
                var sW = splinterImg.width;
                var sH = splinterImg.height;
                context.drawImage(splinterImg, 0, 0, sW, sH, X+sW, Y+sH, -sW/2 * zoom, -sH/2 * zoom);
                if(finished){
                    deleteItem()
                }
            } else {
                if(glitchSin || isGlitch || startCd + startCdAdd > Dn()){
                //if(isGlitching() || isGlitch){
                    if(isGlitch) sprite = drawTriangle(20,20,3);
                    if(startCd + startCdAdd > Dn() && !isGlitch){
                        context.globalAlpha = 1 - (Dn()-startCd)/startCdAdd;
                    }
                    context.drawImage(clipObjectGlitch(drawImage(sprite, w,h,w*zoom/2, h*zoom/2),isGlitch?'red':'lightgreen'), 0, 0, w*zoom/2, h*zoom/2, X, Y, -w/2*zoom, -h/2*zoom);
                    if(startCd + startCdAdd > Dn() && !isGlitch){
                        context.globalAlpha = (Dn()-startCd)/startCdAdd;
                        context.drawImage(sprite, 0, 0, w, h, X, Y, -w/2 * zoom, -h/2 * zoom);
                    }
                    context.globalAlpha = 1;
                } else {
                    context.drawImage(sprite, 0, 0, w, h, X, Y, -w/2 * zoom, -h/2 * zoom);

                }

            }

        }

        if(isBullet){
            context.fillStyle = '#ffffff';
            var size = zoom / 2;
            context.fillRect(X,Y,size,size);
            if(shift){
                var shiftX, shiftY
                for(var i = 0; i < shift; i++){
                    if(lastShiftPositions[i]){
                        context.globalAlpha = i/shift;
                        shiftX = (cWidth/2)+lastShiftPositions[i].x-pX;
                        shiftY = (cHeight/2)+lastShiftPositions[i].y-pY;
                        context.fillRect(shiftX,shiftY,size,size);
                    }
                }
            }
            context.globalAlpha = 1;
        }


        if(tintedImage.alpha > 0){
            context.globalAlpha = tintedImage.alpha;
            context.drawImage(tintedImage.img, 0, 0, w, h, X, Y, -w/2 * zoom, -h/2 * zoom);
        }


        context.restore();
    }

    function throws(dest){
        var calc = getST(dest);
        var sx = calc[0],sy = calc[1],tx = calc[2],ty = calc[3];

        createEntity({
            name : 'grenade',
            x : sx,
            y : sy,
            id : $.id,
            vx : tx,
            vy : ty,
        },[bullets]);
    }

    function getST(dest){
        if($.isPlayer){
            var sy = pY - ((zoom * h/4)*1.3), sx = pX, tx = dest.x +pX, ty = dest.y + pY;
        } else {
            var sy = y - ((zoom * h/4)*1.3), sx = x, tx = dest.x, ty = dest.y- ((zoom * h/4)*1.3);
        }
        return [sx,sy,tx,ty];
    }

    function shoot(shooting, dest){
        isShooting = shooting;
        var cd = $.weapon.checkCooldown();
        if(!shooting || cd){
            //isShooting = !cd && shooting;
            return;
        }

        var calc = getST(dest);
        var sx = calc[0],sy = calc[1],tx = calc[2],ty = calc[3];


        //if($.isPlayer)
            flip = sX < dest.x ? 1 : -1;
        angleRadians = getAngleBetweenTwoPoints(sx,sy,tx,ty)


        $.weapon.fire(sx,sy,angleRadians);

        if($.weapon.getAmmo().ammo<=0 && $.isPlayer){
            delete weapons[$.weapon.name];
            switchWeapon(1);
        }

    }

    function switchToWeapon(weaponname) {
        //console.log(weaponname, weapons);
        if(weapons[weaponname]){
            $.weapon = weapons[weaponname];
            weaponIndex = weaponOrder.indexOf(weaponname)
        }
    }



    function moveX(d) {
        toggleAnimation = toggleAnimation || d;
        d *= powerUpMultiplier($.isPlayer,d);
        if(!$.weapon.checkCooldown())
            flip = d == 0 ? flip : d > 0 ? 1 : -1;
        x += d;
    }
    function moveY(d) {
        toggleAnimation = toggleAnimation || d;
        d *= powerUpMultiplier($.isPlayer,d);
        y += d;
    }


    function getDim(){
        return {w:w,h:h};
    }
    function getRealPos(){
        return {x : x, y : y}
    }
    function getPos(){
        return {x : x-w*zoom/4, y : y-h*zoom/2};
        //return {x : x-w*zoom/2, y : y-h*zoom/2}
        //return {x : x-w*zoom/2+zoom*(w/4), y : y-h*zoom/2}
    }
    function getBounding(){
        return {w : w*zoom/2, h : h*zoom/2}
    }
    function setHp(newHp){
        $.hp = newHp
    }
    function addHp(addedHp, addedArmor){
        addedArmor = addedArmor || 0;
        $.armor += addedArmor;
        $.armor = Mi($.armor, maxHp);
        $.hp += addedHp;
        $.hp = Mi($.hp, maxHp);
    }
    function dealDamage(d){
        gotHit = Dn() + hitCd;
        if($.armor){
            var delta = $.armor - d;
            if(delta < 0) {
                d -= $.armor;
                $.armor = 0;
            } else {
                $.armor -= d;
                d = 0;
            }
        }
        $.hp -= d;
        if($.hp <= 0){
            beingDestroyed = that;
            if($.isItem){
                if($.name == 'crate') {
                    var itemname = collectableitems[Ro(getRandomArbitrary(0,3))];
                } else {
                    var itemname = collectableitems[Ro(getRandomArbitrary(4,collectableitems.length-1))];
                }

                createEntity({
                    name : itemname,
                    isCollectable : true,
                    isPowerUp : $.name == 'crate2',
                    x:x,
                    y:y
                },[entities,collectables])
            }
            if($.isEnemy) {
                //player.addHp(10);
                player.addHp(maxHp);
            }
        }
        return $.hp;
    }
    function setRef(ref){
        if(isBot){
            ai = new Ai(ref);

        }
        that = ref
    }
    function getRef(){
        return that
    }

    function givePowerup(powerUpName){
        var charges = 0;
        switch(powerUpName){
            case 'health':
                addHp(250);
                break;
            case 'armor':
                addHp(0,250);
                break;
            case 'speed':
                charges = 200;
                break;
            case 'teleport':
                charges = 3;
                break;
        }
        if(charges)
            hasPowerUp = {
                name : powerUpName,
                charges : charges,
                maxcharges : charges,
            };
    }
    function usePowerup(){
        if(hasPowerUp){
            if(--hasPowerUp.charges <= 0){
                hasPowerUp = undefined;
            }
        }
    }
    function getPowerUp(){
        return hasPowerUp;
    }
    function giveWeapon(weaponname){
        if(weapons[weaponname]){
            weapons[weaponname].addAmmo(weaponsProto[weaponname].ammo);
        } else {
            weapons[weaponname] =  new Weapon(weaponsProto[weaponname], $.id, null, $.isPlayer);
            switchToWeapon(weaponname)
        }

    }

    return exports
};