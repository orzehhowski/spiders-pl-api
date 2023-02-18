import { Request, Response, NextFunction } from "express";
import HttpError from "../errors/HttpError";

import Spider from "../models/spider";
import Family from "../models/family";

interface SpiderInfo {
  name: string | null;
  latinName: string;
  appearanceDesc: string | null;
  behaviorDesc: string | null;
  resources: string | null;
}

class SpiderController {
  getById(req: Request, res: Response, next: NextFunction) {
    Spider.findByPk(+req.params.id, {
      include: Spider.associations.images,
    })
      .then((spider: Spider | null) => {
        if (!spider) {
          throw new HttpError(404, "Spider not found");
        }
        res.status(200).json(spider);
      })
      .catch((err) => {
        next(err);
      });
  }

  post(req: Request, res: Response, next: NextFunction) {
    // add validation

    let resourcesStr: string | null;
    if (typeof req.body.resources === "string") {
      resourcesStr = req.body.resources;
    } else if (req.body.resources == null) {
      resourcesStr = null;
    } else {
      resourcesStr = "";
      req.body.resources.forEach((source: string) => {
        resourcesStr += source + " ";
      });
    }

    const familyId = +req.body.familyId;

    const spiderInfo: SpiderInfo = {
      name: req.body.name || null,
      latinName: req.body.latinName,
      appearanceDesc: req.body.appearanceDesc || null,
      behaviorDesc: req.body.behaviorDesc || null,
      resources: resourcesStr,
    };
    const src = req.file?.path.replace("src/public/", "") || "";

    const imageInfo = {
      src,
      author: req.body.imageAuthor,
    };
    if (imageInfo.src) {
      Family.findByPk(familyId)
        .then((family) => {
          if (family) {
            return family.createSpider(spiderInfo);
          } else {
            throw new HttpError(404, "family not found");
          }
        })
        .then((spider) => {
          return spider.createImage(imageInfo);
        })
        .then(() => {
          res.status(201).json({
            message: "Spider created",
            spider: { ...spiderInfo, image: imageInfo },
          });
        })
        .catch((err) => {
          next(err);
        });
    } else {
      next(new HttpError(422, "Image is required"));
    }
  }

  put(req: Request, res: Response, next: NextFunction) {
    // add validation

    const spiderId = req.body.id;
    const latinName = req.body.latinName || "";
    Spider.findOne({ where: { latinName: latinName } })
      .then((spider) => {
        if (spider) {
          throw new HttpError(
            422,
            "Spider with this latin name allready exists"
          );
        }
        return Spider.findByPk(spiderId);
      })
      .then((spider) => {
        if (!spider) {
          throw new HttpError(404, "Spider not found");
        }

        let resourcesStr: string | null;
        if (typeof req.body.resources === "string") {
          resourcesStr = req.body.resources;
        } else if (req.body.resources == null) {
          resourcesStr = null;
        } else {
          resourcesStr = "";
          req.body.resources.forEach((source: string) => {
            resourcesStr += source + " ";
          });
        }

        const spiderInfo: SpiderInfo = {
          name: req.body.name === undefined ? spider.name : req.body.name,
          latinName: req.body.latinName || spider.latinName,
          appearanceDesc:
            req.body.appearanceDesc === undefined
              ? spider.appearanceDesc
              : req.body.appearanceDesc,
          behaviorDesc:
            req.body.behaviorDesc === undefined
              ? spider.behaviorDesc
              : req.body.behaviorDesc,
          resources: resourcesStr === null ? spider.resources : resourcesStr,
        };

        Object.assign(spider, spiderInfo);
        return spider.save();
      })
      .then((spider) => {
        res
          .status(200)
          .json({ message: "Spider Info updated", spider: spider });
      })
      .catch((err) => {
        next(err);
      });
  }
}

export default new SpiderController();
