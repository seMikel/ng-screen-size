# NgScreenSize

This is a utility library based on Angular Material's [Component Dev Kit](https://material.angular.io/cdk) that provides a simple solution for managing responsive design both within scss and html structure.

## Setup

### Manual

Install the library by running `npm i ng-screen-size`.

#### Default

If you want to use the default settings simply import `NgScreenSizeModule` in your root module.

#### Custom

If you wish to customize the breakpoints of your screen sizes you will need to create a styling file with your screen sizes, such as the following:

> screen-size.scss

    $smScreenWidth: 600px;
    $mdScreenWidth: 960px;
    $lgScreenWidth: 1280px;
    $xlgScreenWidth: 1920px;
    
    @import '~ng-screen-size/styles/screen-size';

**Note: Only provide the screen widths in pixels**

Add this file to your assets in your `angular.json`, like so:

    "assets": [
    	"src/favicon.ico",
    	"src/assets",
    	"src/styles/screen-size.scss",

Once that is done, the last step is to provide the library with that file's location in your root module:

    import { NgScreenSizeModule, ScreenSizeBreakpointVariables } from 'ng-screen-size';
    
    <----------------------------------------------------------------->
    
    providers: [{
    	provide: ScreenSizeBreakpointVariables,
    	useValue: 'styles/screen-size.scss',
    },

Now you can modify the breakpoints of different screen sizes and your changes will persist for both the directive and the mixins.

### Schematic

You can also quickly install the library using a schematic, simply run the command

    ng add ng-screen-size --path src/styles/screen-size.scss

With the `--path` argument being the location at which to generate your custom breakpoints file. Do not provide this argument if you wish to use the default configuration.

## Usage

#### SCSS

The library provides simple mixins (xs, sm, md and lg) to control the style changes for different screens, you can look at the mixins in the source code.

To use the mixins simply import them in the required file with:

    @import '~ng-screen-size/styles/screen-size';

Or the location of your own custom breakpoints file.
If you used the schematics to setup the library, you will have your styles file added to the preproccessor, so you can easily import it with just the file's name, like so:

    @import 'screen-size'

#### HTML

To provide control of the html structure that is consistent to the scss you can use the `*ngScreenSize` directive. The directive takes an array input of sizes for which to render, with ranges being possible using blank items.

Examples:

 - ['sm', 'md']: small and medium screens
 - ['xlg']: only extra large screen
 - ['', 'md']: medium screens and smaller
 - ['md', '']: medium screens and larger
 - ['sm', 'lg']: everything between medium and large screens, inclusive
