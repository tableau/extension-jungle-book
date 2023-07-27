[![As-Is](https://img.shields.io/badge/Support%20Level-As--Is-e8762c.svg)](https://www.tableau.com/support-levels-it-and-developer-tools)

# Image Map Filter (aka Jungle Book)

This extension allows you to create filters using shapes mapped on top of images.

## Using the Extension from Tableau Exchange (Recommended)
See the Tableau Help topic [Use Dashboard Extensions](https://help.tableau.com/current/pro/desktop/en-us/dashboard_extensions.htm) for directions. When presented with the list of available Dashboard Extensions, search for Image Map Filter to find and install this one.

### How to Use

Before starting make sure you have at least one worksheet on the dashboard and that the worksheet has some filters on it.

#### Configuration
- Upon bringing in the extension the configuration window will open up. If you need to open it again select "Configure" from the context menu ont he extension object.
- In the configuration popup click **Choose** and select an image from your machine. 
- Select which field(s) you would like to use to filter your dashboard. 
- Select which worksheets you would like the filter to apply to.
- Finally, choose wether you want the image to stretch to fit the container or stay its original size. Note, if the image at original size does not fit the container it will scroll.

![](./docs/how_to_1.gif)

#### Shape Set-Up
- Once you have configured the extension you can begin to add shapes on top of your image for filtering.
- Hover over the pencil to reveal the three shape options, **Ellipse**, **Lasso**, or **Rectangle**, and select one.
- Click and drag your mouse to draw the desired shape. When using **Ellipse** or **Rectangle** mode you can hold down shift while dragging to get a perfect **Circle** or **Square**.
- Once you let go of the mouse the shape is complete and a pop-up window will allow you to choose which value your shape represents.
- Click **OK** and continue to draw the rest of your shapes. Or click **Delete** if you would like to redraw your shape.

![](./docs/how_to_2.gif)

#### Making Adjustments
- Once you have some shapes created you may need to edit their values or adjust them
- Click on the cursor icon and click on a shape to edit its value or delete it.
- Click on the pan icon and click and drag a shape to move it.

![](./docs/how_to_3.gif)

#### Testing Your Filters
- To test your filters click on the funnel icon and select the areas where you drew shapes.
- This will filter your dashboard according to your settings. Selecting anywhere outside of the shapes you drew will clear the filter.
- You can hold down **Ctrl** do select multiple shapes.
- You will only see the menu and editing options while in authoring mode. Once you publish or are in viewing mode, the menu will go away and remain in filtering mode.

![](./docs/how_to_4.gif)

## Download the Extension Code to Develop Locally
If you want to use a locally-built version of this extension or if you want to make any of your own changes, follow these steps:

1. Make sure you have [Node.js](https://nodejs.org) and [Yarn](https://yarnpkg.com) installed. 
2. Clone or download and unzip this repository. Open the command line to the `extension-jungle-book-master` folder and run `yarn` to install the node modules.
3. Edit the `homepage` in the `package.json` file to the server where you are going to host the extension. For example:
```
"homepage": "http://localhost:8080",
```
4. In the command line run `yarn build` to build the extension with the new homepage.
5. Copy the files in `build` to your web server at the path you specified in Step 3.
6. Update the existing or create a new manifest file (.trex) to point to the URL where you are hosting the extension.

## Support
Tableau customers can contact the Tableau Support team for help.

For any local build or code related questions, please post to the [Issues](https://github.com/tableau/extension-jungle-book/issues) tab here for community support.
