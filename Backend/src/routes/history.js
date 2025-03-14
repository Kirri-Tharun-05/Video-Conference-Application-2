const {getUserHistory,addToHistory}= require('../controllers/history');
const router=require('express').Router();

router.get('/',(req,res)=>{
    res.send('on history route');
})
router.get('/getUserHistory',getUserHistory);
router.post('/addUserHistory',addToHistory);

module.exports=router;
