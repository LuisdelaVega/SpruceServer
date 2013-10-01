module.exports = {
	Item : function(name, category, price, description, image, model, brand, dimensions, startingDate, dateBought, buyer, seller, views) {
		this.id = "";
		this.name = name;
		this.category = category;
		this.price = price;
		this.description = description;
		this.image = image;
		this.model = model;
		this.brand = brand;
		this.dimensions = dimensions;
		this.startingDate = startingDate;
		this.dateBought = dateBought;
		this.buyer = buyer;
		this.seller = seller;
		this.views = views;
	}
}
