const Plugin = require('./plugin')
const Ease = require('pixi-ease')

module.exports = class Snap extends Plugin
{
    /**
     * @param {Viewport} parent
     * @param {number} x
     * @param {number} y
     * @param {object} [options]
     * @param {number} [options.friction=0.8] friction/frame to apply if decelerate is active
     * @param {boolean} [options.center] move the center of the camera to {x, y} (if false, move the top left corner to {x, y})
     * @param {number} [options.time=1000]
     * @param {string|function} [ease='easeInOutSine'] ease function or name (see http://easings.net/ for supported names)
     * @param {boolean} [options.stopOnResize] Stops performing the snap upon resizing
     * @param {boolean} [options.dragInterrupt] Allows users to stop the snapping by dragging (via the 'drag' plugin)
     * @param {boolean} [options.zoomInterrupt] Allows users to stop the snapping by zooming (via the 'wheel' or 'pinch'  plugins)
     * @param {boolean} [options.remove] Removes this plugin after having completed the operation
     */
    constructor(parent, x, y, options)
    {
        super(parent)
        options = options || {}
        this.friction = options.friction || 0.8
        this.time = options.time || 1000
        this.ease = options.ease || 'easeInOutSine'
        this.x = x
        this.y = y
        this.center = options.center
        this.stopOnResize = options.stopOnResize
        this.dragInterrupt = options.dragInterrupt
        this.zoomInterrupt = options.zoomInterrupt
        this.remove = options.remove

        if (this.parent.plugins['decelerate'])
        {
            this.parent.plugins['decelerate'].reset();
        }
        if (!this.dragInterrupt && this.parent.plugins['drag'])
        {
            this.parent.plugins['drag'].pause()
        }
        if (!this.zoomInterrupt)
        {
            if (this.parent.plugins['wheel'])
            {
                this.parent.plugins['wheel'].pause()
            }
            if (this.parent.plugins['pinch'])
            {
                this.parent.plugins['pinch'].pause()
            }
        }

        if (this.center)
        {
            this.x = ((this.parent.worldScreenWidth / 2 - this.x) * this.parent.container.scale.x)
            this.y = (this.parent.worldScreenHeight / 2 - this.y) * this.parent.container.scale.y
        }
        this.moving = new Ease.to(this.parent.container, { x: this.x, y: this.y }, this.time, { ease: this.ease })
    }

    resize()
    {
        if (this.stopOnResize)
        {
            this.reset()        }
    }

    down()
    {
        if (this.dragInterrupt)
        {
            this.reset()
        }
    }

    up()
    {
        const decelerate = this.parent.plugins['decelerate']
        if (decelerate && (decelerate.x || decelerate.y))
        {
            decelerate.percentChangeX = decelerate.percentChangeY = this.friction
        }
    }

    update(elapsed)
    {
        if (this.paused)
        {
            return
        }

        if (this.moving && this.moving.update(elapsed))
        {
            this.reset()
        }
    }

    reset()
    {
        this.moving = null
        if (this.remove) 
        {
            this.parent.removePlugin('snap')
        }
        else
        {
            this.onRemove()
        }
    }

    onRemove()
    {
        if (!this.dragInterrupt && this.parent.plugins['drag'])
        {
            this.parent.plugins['drag'].resume()
        }
        if (!this.zoomInterrupt)
        {
            if (this.parent.plugins['wheel'])
            {
                this.parent.plugins['wheel'].resume()
            }
            if (this.parent.plugins['pinch'])
            {
                this.parent.plugins['pinch'].resume()
            }
        }
    }
}