/*
*  jQuery module to kick off the Promotions class and attach the events
*
*/
(function( $ ){
    //the instantiated promotion class for this object
    var promotions;
    
    //reference to the control module, we need this to update controls, but mainly to make sure that we've
    //   attached controls to this promotions rotator
    var control;
    
    var methods = {
        init : function( ) {
            //called on $('#whatever').promotions()
            if(promotions == undefined)
            {
                promotions = new Promotions(this);

                //make first slide start loaded
                var org_speed = new Array(); 
                for(var i=0; i<promotions.group[1].slides.length; i++)
                {
                    org_speed[i] = promotions.group[1].slides[i].animate.speed_in;
                    promotions.group[1].slides[i].animate.speed_in = 0;
                }

                promotions.start();
                
                //pass the orginal speed back to the group to reset on exit
                promotions.group[1].org_speed = org_speed;
            }
            return this;
        },
        stop : function( ) {
            //all this does is set a flag for the next group not to kick off
            promotions.stop();
        },
        start: function( ) {
            //resets the halt flag and kicks off the next slide
            promotions.start();
        },
        goto:  function(group) {
            //dont switch to yourself
            if(group == promotions.nextGroup)
                return;
            
            //dont switch to a group that doesnt exist
            if(promotions.group[group] == undefined)
                return;
                                    
            //dont switch to the next one
            promotions.stop();
            
            //end the current one, we want to wait for all the animations to clear
            this.wait = promotions.group[promotions.nextGroup].stop();
            
            //set selected one
            promotions.nextGroup = parseInt(group);
            //restart the rotation
            setTimeout("promotionsGlobalScope['" + this.attr('id') + "']['promotions'].runGroup(" + group +")", this.wait);
        },
        getCount: function ( ) {
            //returns the total # of slides, mainly used for the control module
            //  not sure why we have to subtract 1 from the length here....
            return promotions.group.length - 1; 
        },
        setControl: function (jObj) {
            control = jObj;
        },
        updateControl: function (position) {
            //check to see if a controls been attached
            if(control == undefined)
                return;
                
            //run the control update method
            control.promoControl('update', position);
        }
    };

    //Standard jQuery method calling stuff
    $.fn.promotions = function( method ) {
    
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, 
                Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.promotions' );
        }
        
        return this;
    };
})( jQuery );



(function( $ ){
    //jQuery object for the ul the control is attached
    var container;
    
    //this function when out of scope?
    var caller;

    var methods = {
        init: function ( control_id ) {
            //set self for later
            container = $('#' + control_id);
            
            //find out how many slides we have
            this.groups = this.promotions('getCount');
            
            //tell the promotions module that it has control and reference to it
            this.promotions('setControl', this);
            
            //create a selector for each slide
            for(var i=1; i<=this.groups; i++)
            {
                container.append('<li><a href="javascript:void(0);"><div class="button"><span class="count">' + i + '</span></div></a></li>');
            }
            
            //used for the each funcitons
            caller = this;
            
            //add group ident to each selector, and click event to trigger goto
            container.find('li').each(function(index){
               $(this).attr('group', index + 1);
               $(this).addClass('control_' + (index + 1));
               $(this).click(function() {
                    //clear all active
                    container.find('li').removeClass('active');
                    //set selected active
                    container.find('[group=' + (index + 1) + ']').addClass('active');
            
                    caller.promotions('goto',index + 1);
                    //we want to disable the click event during transitions
                    container.find('li').each(function(index){               
                        $(this).unbind('click');
                    });
                });
            });
            container.find('li').first().addClass('first');
            container.find('li').last().addClass('last');
            
            //most likely, I don't know why you would initialize it anyother way.
            container.find('li').first().addClass('active');
        },
        
        update: function ( position ) {
            //this is called by a timeout, happens when the current group completes its transition in          
            
            //clear all active
            container.find('li').removeClass('active');
            //set selected active
            container.find('[group=' + position + ']').addClass('active');
            
            //since the bind event includes an automatic unbind to avoid changing slides
            //  during an animation, we need to turn them back on after
            container.find('li').each(function(index){               
                  $(this).click(function() {
                        //clear all active
                        container.find('li').removeClass('active');
                        //set selected active
                        container.find('[group=' + (index + 1) + ']').addClass('active');
                        caller.promotions('goto',index + 1);
                        container.find('li').each(function(index){               
                            $(this).unbind('click');
                        });
                  });
            });

        }
    };
    
    //A little differnt type of method calling than the normal
    //  we want to be able to pass the init method the id for where the control should be
    //  since we are attaching it to the promotions module
    $.fn.promoControl = function( method ) {
    
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, 
                Array.prototype.slice.call( arguments, 1 ));
        } else {
            return methods.init.apply( this, arguments );
        }
        
        return this;
    };
})( jQuery );


//Only because IE can't pass objects into setTimeout *eyeroll*
var promotionsGlobalScope = new Array();

/*
*  Singleton factory to return animation methods
*/
var Animations = {
    getAnimation: function (direction){
        switch(direction)
        {   
            case 'up':
                return this.moveSlideUp;
                break;
            case 'down':
                return this.moveSlideDown;
                break;
            case 'left':
                return this.moveSlideLeft;
                break;
            case 'right':
                return this.moveSlideRight;
                break;
        }
    },
    
    
    //Since these methods are getting returned to the slide
    //  any reference to "this" is actually the slides animation class
    //  the method checkSpeed is called to toggle between animate in speed and out speed
    moveSlideUp: function (){
        this.checkSpeed();
        this.jObj.animate({top:"-=" + this.jObj.height() + "px"}, this.speed, this.easing);
    },
    
    moveSlideDown: function(){
        this.checkSpeed();
        this.jObj.animate({top:"+=" + this.jObj.height() + "px"}, this.speed, this.easing);
    },
    
    moveSlideLeft: function(){
        this.checkSpeed();
        this.jObj.animate({left:"-=" + this.jObj.width() + "px"}, this.speed, this.easing);
    },
    
    moveSlideRight: function(){
        this.checkSpeed();
        this.jObj.animate({left:"+=" + this.jObj.width() + "px"}, this.speed, this.easing);
    }
    
}

/*
*  There are basically three parts to this module.  
*   The Promotions class which holds groups (Promotion), and controls when they start, end, and how to run the next one
*   The Promotion class which holds slides, triggers each individul slide in that set when to animate and such
*   And the Slides class which has basic information about the slide and how it should animate.
*/
function Promotions (jObj) {
    //needs to be able to create groups from the slides
    this.allSlides = jObj.find('.slides');
    
    //reference to the promotions jquery caller
    this.container = jObj;
    
    //collection of promotion
    this.group = new Array();
    
    //used for timeouts and each calls
    var promotions = this;
    
    //when run is called, which slide should start animating
    this.nextGroup = 0;
    
    //flag for runNextGroup to see if we should continue to the next one or not
    this.halt = null; //uninitialize
    
    //create empty groups
    this.allSlides.each(function(index){
        if(promotions.group[$(this).attr('group')] == undefined)
            promotions.group[$(this).attr('group')] = 
                new Promotion($(this).parents()[2].id,
                            $(this).attr('group'));
    });
    
    //add the slides to the groups
    this.allSlides.each(function(index){
        promotions.group[$(this).attr('group')].addSlide(new Slide($(this)));
    });
    
    //default action of the module to go to the next step
    this.runNextGroup = function(currentGroup)
    {
        if(this.halt)
            return;
         
        //currentGroup is used when a slide finishes its loop and the executes runNextGroup passing its ident
        //  to let us know which slide should be next, if its not passed we look to see if ones been set, or if all else fails
        //  we should have one to reference that we set from the previous iteration
        if(currentGroup == undefined)
            currentGroup = this.nextGroup;
            
        //stop the current group, see how long we need to wait for its slides animation to stop so we can start the next one
        if(currentGroup != 0)
            this.wait = this.group[currentGroup].stop();
        
        //get the next group, if it doesnt exist, we've looped around (probably, lol)
        this.nextGroup = parseInt(currentGroup) + 1;
        if(this.group[this.nextGroup] == undefined)
            this.nextGroup = 1;
        
        //IE non-sense make sure we have a reference back to this for the timeout
        promotionsGlobalScope[this.container.attr('id')]['promotions'] = this;
        
        //create timeout to start next group's animation
        //  up the time out by 10 ms to account for any js execution delay
        setTimeout(
            "promotionsGlobalScope['" + this.container.attr('id') + "']['promotions'].runGroup(promotionsGlobalScope['" + this.container.attr('id') + "']['promotions'].nextGroup)",this.wait-25);
    }
    
    //start the groups animation that was passed
    this.runGroup = function(group)
    {
        //bad things have happend.
        if(this.group[group] == undefined)
            return;
        
        //tells the group to start each slides animation
        this.group[group].start(this);
        
        //if this was true, when you switched groups it would stop
        this.halt = false; //probably, might make this an option
    }

    //turns the slideshow back on, and runs whatever group is queued up.
    this.start = function()
    {
        if(this.halt == false)
            return;
            
        this.halt = false;
        this.runNextGroup();
    }

    this.stop = function()
    {
        this.halt = true;
    }
    
}
    
/*
* Container for slides, controls individual slides start and stop times for the group
*
*/

function Promotion (parent_container_id, group) {
    //groups slides
    this.slides = new Array();
    //group ident
    this.group = parseInt(group);
    //parents element id
    this.parent_id = parent_container_id;
    //speed override
    this.org_speed = null;
    
    //Create container for all the references we need for the timeouts (might want to move this to the promotions class)
    if(promotionsGlobalScope[this.parent_id] == undefined)
        promotionsGlobalScope[this.parent_id] = new Array();

    //stuff me with my slides
    this.addSlide = function(Slide){
        this.slides.push(Slide);
    }
 
    //starts all the slides in the group animating to the in position
    //  and sets the timeout for the exit stage
    this.start = function(caller) {
        //caller is the promotions class, since this is where the initiative for the group to start comes from
        promotionsGlobalScope[this.parent_id]['caller'] = caller;
        
        //we need to keep track of the exit timeouts incase we want to switch to another slide before and need to cancel.
        this.exitTimeout = new Array();
        
        //go through each slide and start the animations
        for(i in this.slides)
        {
            //reference to slide for timeout (more ie bs)
            promotionsGlobalScope[this.parent_id]['slide'  + this.group + i] = this.slides[i];
            
            //need to wait for any delay that the slide might have
            setTimeout(
                "promotionsGlobalScope['" + this.parent_id + "']['slide" + this.group + i + "'].animate.enter()",
                this.slides[i].delay
            );
        
            //figure out sometiming stuff
            
            //how long till the first slide will leave?
            if(this.exitDelay == undefined)
                this.exitDelay =  this.slides[i].time + 
                                  this.slides[i].delay +
                                  this.slides[i].animate.speed_in;
            
            if(this.exitDelay > (this.slides[i].time + 
                                 this.slides[i].delay +
                                 this.slides[i].animate.speed_in))
                this.exitDelay = this.slides[i].time + 
                                 this.slides[i].delay +
                                 this.slides[i].animate.speed_in;
                                
            //how long till the last slide will finish its entry animation?
            if(this.enterTime == undefined)
                this.enterTime = this.slides[i].delay + this.slides[i].animate.speed_in;
        
            if(this.enterTime < (this.slides[i].delay + this.slides[i].animate.speed_in))
                this.enterTime = this.slides[i].delay + this.slides[i].animate.speed_in;
        }
        
        //We need to wait until all the slides have started their exit animations to start the next group
        this.exitTimeout.push(
            setTimeout(
                "promotionsGlobalScope['" + this.parent_id + "']['caller'].runNextGroup(" + this.group + ");", 
                this.exitDelay
            )
        );
        
        //We need to wait to update the control until the slides entry animations are complete
        this.exitTimeout.push(
            setTimeout(
                "promotionsGlobalScope['" + this.parent_id + "']['caller'].container.promotions('updateControl', " + this.group + ");", 
                this.enterTime
            )
        );
            
            
    }
    
    //Called to get start the exit of each group
    this.stop = function() {
        //??
        if(this.exitTimeout == undefined)
            return;
        //?dragon?
        if(this.exitTimeout.length == 0)
            return;
        
        //Kill any outstanding animations that haven't happend yet
        //  normally this would be for using the goto or something like that
        for(i in this.exitTimeout)
        {
            clearTimeout(this.exitTimeout[i]);
        }
        
        //clear the timeout array, no reason to go through them again
        this.exitTimeout = new Array();
        
        //We need to start the exit animations from now, whenever that is
        //  we need to find out at what time the first slide would have exited
        //  then we can calculate the new timeouts from there
        for(i in this.slides)
        {
            if(this.zeroTime == undefined)
                this.zeroTime = this.slides[i].time + 
                                this.slides[i].delay +
                                this.slides[i].animate.speed_in;
            
            if(this.zeroTime > (this.slides[i].time + 
                                this.slides[i].delay +
                                this.slides[i].animate.speed_in))
                this.zeroTime = this.slides[i].time + 
                                this.slides[i].delay +
                                this.slides[i].animate.speed_in;
        }
    
        //Wherever we called the stop on the group from will need to know how long to wait
        //  before it can begin the next groups entrance
        this.holdStart = 0;
        
        
        for(i in this.slides)
        {
            //reference to the slide, prolly already there actually
            promotionsGlobalScope[this.parent_id]['slide'  + this.group + i] = this.slides[i];

            //kill any jQuery animation
            this.slides[i].animate.jObj.stop(true);
            
            //reset any override
            if(this.org_speed != null)
                this.slides[i].animate.speed_in = this.org_speed[i];

            //from whenever the first slide is supposed to exit to when this slide is supposed to exit timeout
            setTimeout(
                "promotionsGlobalScope['" + this.parent_id + "']['slide" + this.group + i + "'].animate.exit()",
                (this.slides[i].time + 
                    this.slides[i].delay +
                    this.slides[i].animate.speed_in) - this.zeroTime
            );
                
            //Wait till this slides animations are all done, and then reset it to its starting position
            setTimeout(
                "promotionsGlobalScope['" + this.parent_id + "']['slide" + this.group + i + "'].animate.reset()",
                this.slides[i].animate.speed_out + 
                ((this.slides[i].time + 
                    this.slides[i].delay +
                    this.slides[i].animate.speed_in) - this.zeroTime)
            );
            
            //how long till the last slide has started its animation?
            if(this.holdStart < (this.slides[i].time + 
                                    this.slides[i].delay +
                                    this.slides[i].animate.speed_in) - 
                                    this.zeroTime)
                this.holdStart = (this.slides[i].time + 
                                    this.slides[i].delay +
                                    this.slides[i].animate.speed_in) - 
                                    this.zeroTime;
        }
        return this.holdStart;
    }
}

//Definition for each slide
function Slide(jObj) {
    //basic direction of movement, slide will continue this path unless an out animation is set.
    this.direction_in = jObj.attr('move');
    
    //type of movement for slide, can use any jQuery built in or extention, set to swing by default
    this.easing = jObj.attr('easing');
    if(this.easing == undefined)
        this.easing = 'swing';
    
    //type of movement for slide, can use any jQuery built in or extention, set to swing by default
    this.easing_out = jObj.attr('easing_out');
    if(this.easing_out == undefined)
        this.easing_out = this.easing;

    //to make it easier on the css coder we changed the names to the position they would be starting in
    // rather than the direction they are moving
    switch(this.direction_in)
        {   
            case 'up':
                jObj.addClass('bottom');
                break;
            case 'down':
                jObj.addClass('top');
                break;
            case 'left':
                jObj.addClass('right');
                break;
            case 'right':
                jObj.addClass('left');
                break;
        }

    //alternate movement for leaving the frame
    this.direction_out = jObj.attr('out');
    if(this.direction_out == undefined)
        this.direction_out = this.direction_in; //default is to continue path
    
    //time it takes to enter, used for exit speed too if not defined
    //  TODO: make defaults configurable
    this.speed = jObj.attr('speed');
    if(this.speed == undefined)
        this.speed = 1000; //default
    
    //how long the slide will be displayed for.
    this.time = jObj.attr('time');
    if(this.time == undefined)
        this.time = 8000; // default
    this.time = parseInt(this.time);

    //time it takes to leave, default is to whatever entry speed is
    this.speed_out = jObj.attr('speed_out')
    if(this.speed_out == undefined)
        this.speed_out = this.speed;
        
    //from the start of the group, how long should we wait to have this slide enter?
    this.delay = jObj.attr('delay');
    if(this.delay == undefined)
        this.delay = 0; //default, starts on promotion segement begin
    this.delay = parseInt(this.delay);
    
    //animation object
    this.animate = {
        //reference to self
        jObj  : jObj,
        speed_in: parseInt(this.speed),
        speed_out: parseInt(this.speed_out),
        easing_in: this.easing,
        easing_out: this.easing_out,
        
        //animations are retrived from the Animation factory
        enter : Animations.getAnimation(this.direction_in),
        exit  : Animations.getAnimation(this.direction_out),
        
        //returns the slide to the starting position, thanks jQuery for making this easy
        reset : function(){this.jObj.stop(true);this.jObj.removeAttr('style');},
        
        //what is the current animation speed based on position?
        checkSpeed: function(){ 
                        if(this.jObj.attr('style') == undefined ||
                                this.jObj.attr('style') == '')
                            {
                                this.speed = this.speed_in;
                                this.easing = this.easing_in;
                            } 
                        else
                            {
                                this.speed = this.speed_out;
                                this.easing = this.easing_out;
                            }
                    }                               
    }
}    
