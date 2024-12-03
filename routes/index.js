var express = require('express');
var router = express.Router(); 
let admin_Controler = require("../controllers/crud_controler/admin");
let user_Controler = require("../controllers/crud_controler/user");
const multer = require("../helper/multer.profile");


router.post("/market-freeze",admin_Controler.market_freeze);   //done
router.delete("/user/delete/:id",admin_Controler.userDeleted) //done




router.patch("/userUpdate-players/:userId",admin_Controler.userupdated_player);
router.patch("/userUpdate-team-players/:userId",admin_Controler.userUpdate_team_players);  //done
// router.post("/updateTeam/:userId",admin_Controler.updateTeam);     
router.post("/createPlayer",multer.any(),admin_Controler.playerCreate);   //done
router.get("/players",admin_Controler.playerList);  //done
// for update player data { value } 
router.patch("/updateplayer/:id",multer.any(),admin_Controler.updatePlayer);     //done
router.delete("/deleteplayer/:id",admin_Controler.deletePlayer)     //done


router.get("/faqs",admin_Controler.faqList)          //done
router.post("/faq/create",admin_Controler.faqCreate);    //done
router.put("/faq/edit/:id",admin_Controler.faqUpdate);   //done
router.delete("/faq/delete/:id",admin_Controler.faqDelete);  //done


router.patch('/userUpdate/:id',multer.any(),user_Controler.userUpdated);   //done
router.get("/usertransation",admin_Controler.userTransation);    //done
router.get("/userteamlist/:id",admin_Controler.userTeamList);   //done
router.get("/userList",admin_Controler.userList)         //done


router.post("/banner_create",admin_Controler.bannertext);
router.patch("/banner_update/:id",admin_Controler.bannerupdate);
router.get("/bannertext",admin_Controler.textdisplay)


module.exports = router;
