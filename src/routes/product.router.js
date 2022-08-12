import { Router } from "express"
import ProductManager from '../managers/product.manager.js'
import userAdmin from '../app.js'

const router = Router()
const productService = new ProductManager()

router.get('/', async(req,res)=>{
    let products = await productService.getAll()
    res.send({products})
})

router.get('/:pid', validatePid, async(req,res)=>{
    res.send(req.params.product)
})

router.put('/:pid', validatePid, async (req,res)=>{
    if(!userAdmin){
        return res.send({error:-1, descripction: "route '/products/:pid' method 'PUT' no authorized"})
    }else{
        const {name, price, stock, enable} = req.body
        if(!name||!price||!stock||!enable){
            return res.status(400).send({status:'error', error:"blank spaces are NOT allowed"})
        }else{
            try {
                await productService.updateProduct(req.params.pid, req.body)
                res.send({status:'success',message:'successfully saved'})
            } catch (error) {
                return res.status(500).send({status:'error', error:"it couldn't update the product"})
            }
        }
    }
})

router.post('/',async (req,res)=>{
    if(!userAdmin){
        return res.send({error:-1, descripction: "route '/products' method 'POST' no authorized"})
    }else{
        const {name, price, stock} = req.body
        //faltan las validaciones de los campos
        if(!name||!price||!stock){
            return res.status(300).send({status:'error', error:"blank spaces are NOT allowed"})
        }else{
            try {
                await productService.addProduct(req.body)
                
            } catch (error) {
                return res.status(500).send({status:'error', error:"it couldn't save the product"})
            }
            res.send({status:'success',message:'successfully saved' })
        }
    }
})

router.delete('/:pid', validatePid, async(req,res)=>{
    if(!userAdmin){
        return res.send({error:-1, descripction: "route '/products/:pid' method 'DELETE' no authorized"})
    }else{
        try {
            await productService.deleteProductById(req.params.pid)
        } catch (error) {
            return res.status(500).send({status:'error', error:"it couldn't delete the product"})
        }
        res.send({status:'success',message:'successfully deleted' })
    }
})

router.get('/*:params',(req,res)=>{
    res.send({ error : -2, descripcion: `route '/api/products/${req.params[0]}' method 'GET' no implemented`})
})

async function validatePid(req,res,next){
    try {
        req.params.pid = parseInt(req.params.pid)
    } catch (error) {
        return res.status(400).send({status:'error', error:'Invalid id'})
    }
    req.params.product = await productService.getProductById(req.params.pid)
    if(req.params.product === null) return res.status(404).send({status:'error', error:'Product not found'})
    next()
}

export default router