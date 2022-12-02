import { userAdmin, logger } from '../app.js'
import persistenceFactory from '../dao/Factory.js'
import __dirname from "../utils.js"
import { emailTransport, emailHTMLmaker } from "../utils.js"


const getCarts = async (req,res)=>{
    let cart = await persistenceFactory.CartService.getAll()
    res.send(cart)
}
const createOne = async (req,res)=>{
    await persistenceFactory.CartService.create()
    res.send({status:'success',message:'successfully created'})
}
const deleteById = async (req,res)=>{
    if(!userAdmin){
        return res.send({error:-1, descripction: "route '/carts/:cid' method 'DELETE' no authorized"})
    }else{
        try {
            await persistenceFactory.CartService.deleteById(req.params.cid)
            res.send({status:'success',message:'successfully deleted'})
        } catch (error) {
            logger.error(`cart couldn't been deleted | Method: ${req.method} | URL: ${req.originalUrl}`)
            return res.status(500).send({status:'error', error:"cart couldn't been deleted"})
        }
    }
}
const getWhole = async (req,res)=>{
    try {
        let report = []
        let cart = await persistenceFactory.CartService.getById(req.params.cid)
        let productList = {}
        for(let element of cart.products){
            productList = {
                product: await persistenceFactory.ProductService.getById(element.id),
                quantity:element.quantity
            }
            report.push(productList)
        }
        res.send(report)
    } catch (error) {
        logger.error(`Products couldn't be listed | Method: ${req.method} | URL: ${req.originalUrl}`)
        return res.status(500).send({status:'error', error:"Products couldn't be listed"})
    }
}
const addProducts = async (req,res)=>{
    const {pid, quantity} = req.body
    const { cartId } = req.body.user

    if(!pid||!quantity){
        return res.status(300).send({status:'error', error:"blank spaces are NOT allowed"})
    }else{
        try {
            const product = await persistenceFactory.ProductService.getById(pid)
            await persistenceFactory.CartService.addProductToCart(cartId, product, parseInt(quantity))
            const cart = await persistenceFactory.CartService.getCartId(cartId)
            return res.send({status:'success',message:'successfully saved into the cart', })
        } catch (error) {
            logger.error(`Couldn't upload the product into the cart | Method: ${req.method} | URL: ${req.originalUrl}`)
            return res.status(500).send({status:'error', error:"it couldn't upload the product into the cart"})
        }
    }
}
const purchase = async (req,res)=>{
    try {
        let cart = await persistenceFactory.CartService.getCartId(req.body.user.cartId)
        
        for (const element of cart.products) {
            element.product.stock -= element.qty // Update stock
            await persistenceFactory.ProductService.update(element.product) //update product
        }
        const date = new Date()
        const code =`O${cart.total}-${date[Symbol.toPrimitive]('number')}`
        
        const purchase = {products:cart.products, totalQty:cart.total, code}
        
        const user = req.body.user
        user.purchases.push(purchase)
        await persistenceFactory.UserService.update(user.id, user)
        
        let html = emailHTMLmaker(purchase,user)
        let result = await emailTransport.sendMail({
            from:'Café Cartagena',
            to:user.email,
            subject:'Purchase Café Cartagena',
            html:html
        })
        
        await persistenceFactory.CartService.emptyCart(cart.id)
        res.render('purchase', {purchase})
        
    } catch (error) {
        res.status(500).send({error:'internal server error', message:"Purchase error"})
    }
}
const deleteProduct = async (req,res)=>{
    try {
        const product = await persistenceFactory.ProductService.getById(req.params.pid)
        const cart = await persistenceFactory.CartService.deleteProductFromCart(req.params.cid, product,req.params.pid)
        res.send({status:'success',message:'successfully deleted from cart', cart:cart})
    } catch (error) {
        logger.error(`Couldn't delete the product from the cart | Method: ${req.method} | URL: ${req.originalUrl}`)
        return res.status(500).send({status:'error', error:"it couldn't delete the product from the cart"})
    }
}
const emptyCart = async (req,res)=>{
    try {
        const cart = await persistenceFactory.CartService.emptyCart(req.params.cid)
        res.send({status:'success',message:'successfully deleted', cart:cart})
    } catch (error) {
        logger.error(`Couldn't delete the product from the cart | Method: ${req.method} | URL: ${req.originalUrl}`)
        return res.status(500).send({status:'error', error:"it couldn't delete the product from the cart"})
    }
}


export default {
    getCarts,
    createOne,
    deleteById,
    getWhole,
    addProducts,
    purchase,
    deleteProduct,
    emptyCart,
}