const Service = require('../models/Service');

// CREATE SERVICE

const services = [
  {
    id: 1,
    name: "WEB DEVELOPMENT",
    icon: 'code'
  },
  {
    id: 2,
    name: "AI AUTOMATION",
    icon: 'bot'
  },
  {
    id: 3,
    name: "APP DEVELOPMENT",
    icon: 'smartphone'
  },
  {
    id: 4,
    name: "WEB DESIGN",
    icon: 'palette'
  },
  {
    id: 5,
    name: "GRAPHIC DESIGN",
    icon: 'brush'
  },
  {
    id: 6,
    name: "CYBER SECURITY",
    icon: 'shield'
  },
  {
    id: 7,
    name: "DATA ANALYSIS",
    icon: 'barchart'
  },
  {
    id: 8,
    name: "DEVOPS & CLOUD",
    icon: 'cloud'
  },
];

// const seedServices = async () => {
//   try {
//       await Service.insertMany(services);
//       console.log('Services seeded successfully');
    
//   } catch (error) {
//     console.log('Error seeding services:', error);
//   }
// };

// seedServices();

const createService = async (req, res) => {
  try {
    const { name, icon } = req.body;

    if (!name || !icon) {
      return res.status(400).json({
        success: false,
        message: 'Name and icon are required',
      });
    }

    const existingService = await Service.findOne({ name });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Service already exists',
      });
    }

    const service = await Service.create({
      name,
      icon,
      createdBy: req.user?._id,
    });

    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Error creating service',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    console.log('Error in createService:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET ALL SERVICES
const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.log('Error in getServices:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// GET SINGLE SERVICE
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate({
      path: 'projects',
      populate: {
        path: 'user', 
        select: '-password -refreshToken'
      }
      })
      .populate({
      path: 'projects',
      populate: {
        path: 'service',
        select: 'name _id'
      }
      })
      .exec();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.log('Error in getService:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// UPDATE SERVICE
const updateService = async (req, res) => {
  try {
    const { name, icon } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    service.name = name || service.name;
    service.icon = icon || service.icon;

    const updatedService = await service.save();

    return res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService,
    });
  } catch (error) {
    console.log('Error in updateService:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// DELETE SERVICE
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    await service.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.log('Error in deleteService:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};